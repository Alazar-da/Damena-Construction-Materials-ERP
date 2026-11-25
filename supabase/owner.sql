-- Owner-only block and terrace price management.
-- Staff must use the protected product-sale RPC; they do not get direct product updates.
revoke update on table public.products from authenticated, anon;
revoke update on table public.sales from authenticated, anon;
grant update (low_stock_threshold) on table public.products to authenticated;

revoke update (low_stock_threshold) on table public.products from authenticated;

create table if not exists public.owner_edit_log(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists owner_edit_log_created_at_idx on public.owner_edit_log(created_at desc);
alter table public.owner_edit_log enable row level security;
drop policy if exists owner_edit_log_select on public.owner_edit_log;
create policy owner_edit_log_select on public.owner_edit_log for select to authenticated using (
  exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active)
);
grant select on public.owner_edit_log to authenticated;

create or replace function public.log_owner_edit(p_entity_type text,p_entity_id uuid,p_before jsonb,p_after jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role in ('super_admin', 'manager') and is_active) then raise exception 'owner or manager access required'; end if;
  insert into public.owner_edit_log(actor_id,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),p_entity_type,p_entity_id,coalesce(p_before,'{}'::jsonb),coalesce(p_after,'{}'::jsonb));
end $$;
revoke all on function public.log_owner_edit(text,uuid,jsonb,jsonb) from public;
grant execute on function public.log_owner_edit(text,uuid,jsonb,jsonb) to authenticated;

create or replace function public.update_product_price(p_product_id uuid,p_price numeric)
returns void language plpgsql security definer set search_path=public as $$
declare p public.products%rowtype; before_data jsonb;
begin
  if auth.uid() is null or not exists(
    select 1 from public.profiles
    where id=auth.uid() and role in ('super_admin', 'manager') and is_active
  ) then raise exception 'owner or manager access required'; end if;
  if p_price is null or p_price<0 then raise exception 'price cannot be negative'; end if;
  select * into p from public.products where id=p_product_id and is_active and category in ('brick','terazone') for update;
  if not found then raise exception 'only active block and terrace products can be repriced'; end if;
  before_data:=to_jsonb(p);
  update public.products
    set selling_price=p_price
    where id=p_product_id and is_active and category in ('brick','terazone');
  select * into p from public.products where id=p_product_id;
  perform public.log_owner_edit('product_price',p_product_id,before_data,to_jsonb(p));
end $$;

grant execute on function public.update_product_price(uuid,numeric) to authenticated;

create or replace function public.update_product_threshold(p_product_id uuid,p_threshold numeric)
returns void language plpgsql security definer set search_path=public as $$
declare p public.products%rowtype; before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role in ('super_admin', 'manager') and is_active) then raise exception 'owner or manager access required'; end if;
  if p_threshold is null or p_threshold<0 then raise exception 'threshold cannot be negative'; end if;
  select * into p from public.products where id=p_product_id and is_active for update;
  if not found then raise exception 'product not found'; end if;
  before_data:=to_jsonb(p);
  update public.products set low_stock_threshold=p_threshold where id=p_product_id;
  select * into p from public.products where id=p_product_id;
  perform public.log_owner_edit('stock_threshold',p_product_id,before_data,to_jsonb(p));
end $$;
grant execute on function public.update_product_threshold(uuid,numeric) to authenticated;

-- Keep the existing owner debt-settlement helper available without granting direct product edits.
create or replace function public.settle_sale_debt(p_sale_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare s public.sales%rowtype; before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active) then raise exception 'owner access required'; end if;
  select * into s from public.sales where id=p_sale_id for update;
  if not found then raise exception 'sale not found'; end if;
  before_data:=to_jsonb(s);
  update public.sales set paid_amount=total_amount,status='paid' where id=p_sale_id;
  select * into s from public.sales where id=p_sale_id;
  perform public.log_owner_edit('sale_settlement',p_sale_id,before_data,to_jsonb(s));
end $$;

grant execute on function public.settle_sale_debt(uuid) to authenticated;

-- Owner-only correction tools for records entered by staff. No rows are deleted.
create or replace function public.owner_update_sale(
  p_sale_id uuid,p_quantity numeric,p_unit_price numeric,p_customer_name text,
  p_paid_amount numeric,p_payment_method text,p_sale_date date,p_notes text
) returns void language plpgsql security definer set search_path=public as $$
declare s public.sales%rowtype; l public.sale_lines%rowtype; p public.products%rowtype; total numeric; new_stock numeric; n integer; before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active) then raise exception 'owner access required'; end if;
  if p_quantity is null or p_quantity<=0 or p_unit_price is null or p_unit_price<0 then raise exception 'quantity and price are invalid'; end if;
  if p_paid_amount is null or p_paid_amount<0 then raise exception 'paid amount cannot be negative'; end if;
  if p_payment_method not in ('cash','bank','credit') then raise exception 'invalid payment method'; end if;
  select * into s from public.sales where id=p_sale_id for update;
  if not found or s.status='void' then raise exception 'active sale not found'; end if;
  select count(*) into n from public.sale_lines where sale_id=p_sale_id;
  if n<>1 then raise exception 'only single-product sales can be edited here'; end if;
  select * into l from public.sale_lines where sale_id=p_sale_id for update;
  before_data:=jsonb_build_object('sale',to_jsonb(s),'line',to_jsonb(l));
  if l.product_id is not null then
    select * into p from public.products where id=l.product_id for update;
    if not found then raise exception 'sale product not found'; end if;
  end if;
  total:=round(p_quantity*p_unit_price,2);
  if p_paid_amount>total then raise exception 'paid amount cannot exceed the corrected total'; end if;
  if l.product_id is not null and p.is_stock_tracked then
    new_stock:=p.stock_on_hand+l.quantity-p_quantity;
    if new_stock<0 then raise exception 'correction would make stock negative'; end if;
    update public.products set stock_on_hand=new_stock where id=p.id;
    update public.inventory_movements set quantity_delta=-p_quantity
      where id=(select id from public.inventory_movements where product_id=p.id and movement_type='sale' and reason='Sold on '||s.invoice_number order by created_at desc limit 1);
    if not found and l.quantity<>p_quantity then
      insert into public.inventory_movements(product_id,quantity_delta,movement_type,reason)
      values(p.id,l.quantity-p_quantity,'owner_correction','Sale correction '||s.invoice_number);
    end if;
  end if;
  update public.sale_lines set quantity=p_quantity,unit_price=p_unit_price where id=l.id;
  update public.sales set sale_date=coalesce(p_sale_date,s.sale_date),customer_name=nullif(trim(p_customer_name),''),total_amount=total,paid_amount=p_paid_amount,payment_method=p_payment_method,status=case when p_paid_amount=total then 'paid'::public.sale_status else 'open'::public.sale_status end,notes=p_notes where id=s.id;
  select * into s from public.sales where id=p_sale_id;
  select * into l from public.sale_lines where sale_id=p_sale_id;
  perform public.log_owner_edit('sale',p_sale_id,before_data,jsonb_build_object('sale',to_jsonb(s),'line',to_jsonb(l)));
end $$;

create or replace function public.owner_update_service_payment(
  p_id uuid,p_service_type text,p_customer_name text,p_amount numeric,p_notes text
) returns void language plpgsql security definer set search_path=public as $$
declare r public.service_payments%rowtype; before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active) then raise exception 'owner access required'; end if;
  if p_service_type not in ('battery_charging','battery_acid','welding','door_window') then raise exception 'invalid service'; end if;
  if p_amount is null or p_amount<0 then raise exception 'amount cannot be negative'; end if;
  select * into r from public.service_payments where id=p_id for update;
  if not found then raise exception 'service payment not found'; end if;
  before_data:=to_jsonb(r);
  update public.service_payments set service_type=p_service_type,customer_name=nullif(trim(p_customer_name),''),amount=p_amount,notes=p_notes where id=p_id;
  if not found then raise exception 'service payment not found'; end if;
  select * into r from public.service_payments where id=p_id;
  perform public.log_owner_edit('service_payment',p_id,before_data,to_jsonb(r));
end $$;

create or replace function public.owner_update_payroll(
  p_id uuid,p_worker_name text,p_pay_type public.pay_type,p_period_start date,p_amount numeric,p_payment_method text,p_notes text
) returns void language plpgsql security definer set search_path=public as $$
declare r public.payroll_records%rowtype; before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active) then raise exception 'owner access required'; end if;
  if nullif(trim(p_worker_name),'') is null then raise exception 'worker name is required'; end if;
  if p_period_start is null or p_amount is null or p_amount<=0 then raise exception 'date and positive amount are required'; end if;
  if p_payment_method not in ('cash','bank','mobile') then raise exception 'invalid payment method'; end if;
  select * into r from public.payroll_records where id=p_id and status='paid' for update;
  if not found then raise exception 'paid payroll record not found'; end if;
  before_data:=to_jsonb(r);
  update public.payroll_records set worker_name=trim(p_worker_name),pay_type=p_pay_type,period_start=p_period_start,amount=p_amount,rate_snapshot=p_amount,quantity=1,payment_method=p_payment_method,notes=p_notes where id=p_id and status='paid';
  if not found then raise exception 'paid payroll record not found'; end if;
  select * into r from public.payroll_records where id=p_id;
  perform public.log_owner_edit('payroll',p_id,before_data,to_jsonb(r));
end $$;

create or replace function public.owner_update_production(
  p_id uuid,p_production_date date,p_output_quantity numeric,p_notes text
) returns void language plpgsql security definer set search_path=public as $$
declare r public.production_runs%rowtype;p public.products%rowtype;new_stock numeric;delta numeric;before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active) then raise exception 'owner access required'; end if;
  if p_output_quantity is null or p_output_quantity<=0 or p_production_date is null then raise exception 'date and positive output are required'; end if;
  select * into r from public.production_runs where id=p_id for update;
  if not found then raise exception 'production record not found'; end if;
  before_data:=to_jsonb(r);
  select * into p from public.products where id=r.output_product_id for update;
  if not found then raise exception 'output product not found'; end if;
  delta:=p_output_quantity-r.output_quantity;
  new_stock:=p.stock_on_hand+delta;
  if new_stock<0 then raise exception 'correction would make stock negative'; end if;
  update public.products set stock_on_hand=new_stock where id=p.id;
  update public.production_runs set production_date=p_production_date,output_quantity=p_output_quantity,notes=p_notes where id=r.id;
  if delta<>0 then insert into public.inventory_movements(product_id,quantity_delta,movement_type,reason) values(p.id,delta,'owner_correction','Production correction'); end if;
  select * into r from public.production_runs where id=p_id;
  perform public.log_owner_edit('production',p_id,before_data,to_jsonb(r));
end $$;

create or replace function public.owner_update_movement(
  p_id uuid,p_quantity numeric,p_reason text
) returns void language plpgsql security definer set search_path=public as $$
declare m public.inventory_movements%rowtype;p public.products%rowtype;new_delta numeric;new_stock numeric;before_data jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='super_admin' and is_active) then raise exception 'owner access required'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'quantity must be positive'; end if;
  select * into m from public.inventory_movements where id=p_id and movement_type in ('receipt','internal_use') and reason<>'Used in production' for update;
  if not found then raise exception 'editable stock movement not found'; end if;
  before_data:=to_jsonb(m);
  select * into p from public.products where id=m.product_id for update;
  if not found then raise exception 'stock product not found'; end if;
  new_delta:=case when m.movement_type='receipt' then p_quantity else -p_quantity end;
  new_stock:=p.stock_on_hand-m.quantity_delta+new_delta;
  if new_stock<0 then raise exception 'correction would make stock negative'; end if;
  update public.products set stock_on_hand=new_stock where id=p.id;
  update public.inventory_movements set quantity_delta=new_delta,reason=coalesce(nullif(trim(p_reason),''),reason) where id=m.id;
  select * into m from public.inventory_movements where id=p_id;
  perform public.log_owner_edit('stock_movement',p_id,before_data,to_jsonb(m));
end $$;

grant execute on function public.owner_update_sale(uuid,numeric,numeric,text,numeric,text,date,text) to authenticated;
grant execute on function public.owner_update_service_payment(uuid,text,text,numeric,text) to authenticated;
grant execute on function public.owner_update_payroll(uuid,text,public.pay_type,date,numeric,text,text) to authenticated;
grant execute on function public.owner_update_production(uuid,date,numeric,text) to authenticated;
grant execute on function public.owner_update_movement(uuid,numeric,text) to authenticated;
