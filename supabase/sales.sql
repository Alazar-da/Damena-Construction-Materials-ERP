-- Product sales support for existing installations.
alter table public.sales add column if not exists recorded_by uuid references public.profiles(id);

drop function if exists public.record_product_sale(uuid,numeric,numeric,text,numeric,text,date,text);
drop function if exists public.record_product_sale(uuid,numeric,text,numeric,text,date,text);

create or replace function public.record_product_sale(
  p_product_id uuid,
  p_quantity numeric,
  p_customer_name text default null,
  p_payment_method text default 'cash',
  p_sale_date date default (now() at time zone 'Africa/Nairobi')::date,
  p_notes text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  p products%rowtype;
  s sales%rowtype;
  total numeric;
begin
  perform bootstrap_current_user();
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'quantity must be positive'; end if;
  select * into p from products where id=p_product_id and is_active for update;
  if not found then raise exception 'product is missing'; end if;
  if p.category='cement' then raise exception 'cement is not for sale'; end if;
  if p.selling_price is null or p.selling_price < 0 then raise exception 'owner has not set a valid selling price'; end if;
  total := round(p_quantity * p.selling_price, 2);
  if p.is_stock_tracked and p.stock_on_hand < p_quantity then raise exception 'insufficient stock'; end if;
  insert into sales(sale_date,customer_name,total_amount,paid_amount,payment_method,status,notes,recorded_by)
  values(coalesce(p_sale_date,(now() at time zone 'Africa/Nairobi')::date),nullif(trim(p_customer_name),''),total,total,p_payment_method,'paid'::sale_status,p_notes,auth.uid()) returning * into s;
  insert into sale_lines(sale_id,product_id,item_name_snapshot,unit_snapshot,quantity,unit_price)
  values(s.id,p.id,p.name,p.unit,p_quantity,p.selling_price);
  if p.is_stock_tracked then
    update products set stock_on_hand=stock_on_hand-p_quantity where id=p.id;
    insert into inventory_movements(product_id,quantity_delta,movement_type,reason)
    values(p.id,-p_quantity,'sale','Sold on '||s.invoice_number);
  end if;
  return s.id;
end $$;

grant execute on function public.record_product_sale(uuid,numeric,text,text,date,text) to authenticated;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (is_admin());
