-- ============================================================================
-- DAMENA ERP: BROKEN / DAMAGED MATERIALS REGISTRATION & STORE DEDUCTION
-- ============================================================================
-- Run this script in the Supabase SQL Editor to enable breakage registration.
-- It grants necessary table permissions and creates the secure RPC function.
-- ============================================================================

-- 1. Grant table access
grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.products to authenticated, service_role;
grant select, insert on public.inventory_movements to authenticated, service_role;

-- 2. Create the secure RPC function
create or replace function public.record_broken_materials(
  p_product_id uuid,
  p_quantity numeric,
  p_reason text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  p public.products%rowtype;
  x uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'የተሰበረው ብዛት ከ 0 በላይ መሆን አለበት።';
  end if;

  -- Lock and fetch product
  select * into p from public.products where id = p_product_id and is_active for update;
  if not found then
    raise exception 'የተመረጠው ምርት በመረጃ ቋቱ ውስጥ አልተገኘም።';
  end if;

  if p.stock_on_hand < p_quantity then
    raise exception 'በቂ ክምችት በመጋዘን ውስጥ የለም። አሁን ያለው፦ % ፍሬ ብቻ ነው።', p.stock_on_hand;
  end if;

  -- 1. Deduct directly from warehouse stock
  update public.products
  set stock_on_hand = stock_on_hand - p_quantity
  where id = p.id;

  -- 2. Log in inventory movements as breakage
  insert into public.inventory_movements(
    product_id,
    quantity_delta,
    movement_type,
    reason
  ) values (
    p.id,
    -p_quantity,
    'breakage',
    coalesce(nullif(trim(p_reason), ''), 'በትራንስፖርት/በሽያጭ ወቅት የተሰበረ')
  ) returning id into x;

  return x;
end $$;

grant execute on function public.record_broken_materials(uuid, numeric, text) to anon, authenticated, service_role;
