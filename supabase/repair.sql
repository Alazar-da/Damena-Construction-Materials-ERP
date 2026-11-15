-- Run this if the tables already exist but the app shows no cement or products.
-- It preserves existing stock, movements, and production history.

grant usage on schema public to anon, authenticated, service_role;
grant select on public.products, public.inventory_movements, public.production_runs, public.production_materials, public.service_payments to authenticated;
grant execute on function public.bootstrap_current_user() to authenticated;
grant execute on function public.receive_cement(numeric,text) to authenticated;
grant execute on function public.issue_cement(numeric,text) to authenticated;
grant execute on function public.record_output(uuid,numeric,text) to authenticated;
grant execute on function public.record_service_payment(text,text,numeric,text) to authenticated;

insert into public.products(name,sku,category,unit,low_stock_threshold,is_stock_tracked,is_active)
values
  ('Cement 50kg','CEMENT-50KG','cement','bag',10,true,true),
  ('10/10 Block','BLOCK-10-10','brick','piece',20,true,true),
  ('15/15 Block','BLOCK-15-15','brick','piece',20,true,true),
  ('20/20 Block','BLOCK-20-20','brick','piece',20,true,true),
  ('Terrace','TERRACE','terazone','piece',20,true,true)
on conflict (sku) do update set is_active=true;

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (true);
drop policy if exists movement_read on public.inventory_movements;
create policy movement_read on public.inventory_movements for select to authenticated using (is_admin());
drop policy if exists production_read on public.production_runs;
create policy production_read on public.production_runs for select to authenticated using (is_admin());

-- Make sure the app's fixed cement actions exist and do not require table reads from the browser.
create or replace function public.receive_cement(p_quantity numeric,p_reason text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare p products%rowtype; x uuid;
begin
  perform bootstrap_current_user();
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'quantity must be positive'; end if;
  select * into p from products where sku='CEMENT-50KG' and is_active for update;
  if not found then raise exception 'cement product is missing'; end if;
  update products set stock_on_hand=stock_on_hand+p_quantity where id=p.id;
  insert into inventory_movements(product_id,quantity_delta,movement_type,reason)
  values(p.id,p_quantity,'receipt',coalesce(p_reason,'Cement received')) returning id into x;
  return x;
end $$;

create or replace function public.issue_cement(p_quantity numeric,p_reason text default null) returns uuid language plpgsql security definer set search_path=public as $$
declare p products%rowtype; x uuid;
begin
  perform bootstrap_current_user();
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'quantity must be positive'; end if;
  select * into p from products where sku='CEMENT-50KG' and is_active for update;
  if not found then raise exception 'cement product is missing'; end if;
  if p.stock_on_hand<p_quantity then raise exception 'insufficient cement'; end if;
  update products set stock_on_hand=stock_on_hand-p_quantity where id=p.id;
  insert into inventory_movements(product_id,quantity_delta,movement_type,reason)
  values(p.id,-p_quantity,'internal_use',coalesce(p_reason,'Given to production')) returning id into x;
  return x;
end $$;

