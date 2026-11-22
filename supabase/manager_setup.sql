-- =====================================================================
-- DAMENA ERP: Manager Role & Permissions Setup
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================================

-- 1. Add 'manager' value to the public.app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- 2. Grant table permissions to service_role and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- 3. Update existing test manager profile (e.g. test@gmail.com) to have role = 'manager'
UPDATE public.profiles
SET role = 'manager', is_active = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'test@gmail.com'
);

-- 4. Update owner_assign_admin_profile to support assigning 'manager' or 'admin'
CREATE OR REPLACE FUNCTION public.owner_assign_admin_profile(
  p_user_id UUID,
  p_display_name TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active
  ) THEN
    RAISE EXCEPTION 'owner access required';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'cannot change a super-admin profile through staff invitations';
  END IF;

  IF p_role = 'manager' THEN
    assigned_role := 'manager'::public.app_role;
  ELSE
    assigned_role := 'admin'::public.app_role;
  END IF;

  INSERT INTO public.profiles(id, display_name, role, is_active)
  VALUES (p_user_id, NULLIF(TRIM(p_display_name), ''), assigned_role, true)
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        role = assigned_role,
        is_active = true;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_assign_admin_profile(UUID, TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.owner_assign_admin_profile(UUID, TEXT, TEXT) TO authenticated;

-- Backwards compatibility 2-arg signature
CREATE OR REPLACE FUNCTION public.owner_assign_admin_profile(
  p_user_id UUID,
  p_display_name TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.owner_assign_admin_profile(p_user_id, p_display_name, 'admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.owner_assign_admin_profile(UUID, TEXT) TO authenticated;

-- 5. Update update_product_price to permit both super_admin and manager
CREATE OR REPLACE FUNCTION public.update_product_price(p_product_id UUID, p_price NUMERIC)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.products%ROWTYPE;
  before_data JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager') AND is_active
  ) THEN
    RAISE EXCEPTION 'owner or manager access required';
  END IF;

  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'price cannot be negative';
  END IF;

  SELECT * INTO p FROM public.products
  WHERE id = p_product_id AND is_active AND category IN ('brick', 'terazone')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'only active block and terrace products can be repriced';
  END IF;

  before_data := to_jsonb(p);

  UPDATE public.products
  SET selling_price = p_price
  WHERE id = p_product_id AND is_active AND category IN ('brick', 'terazone');

  SELECT * INTO p FROM public.products WHERE id = p_product_id;
  PERFORM public.log_owner_edit('product_price', p_product_id, before_data, to_jsonb(p));
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_product_price(UUID, NUMERIC) TO authenticated;

-- 6. Update update_product_threshold to permit both super_admin and manager
CREATE OR REPLACE FUNCTION public.update_product_threshold(p_product_id UUID, p_threshold NUMERIC)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.products%ROWTYPE;
  before_data JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager') AND is_active
  ) THEN
    RAISE EXCEPTION 'owner or manager access required';
  END IF;

  IF p_threshold IS NULL OR p_threshold < 0 THEN
    RAISE EXCEPTION 'threshold cannot be negative';
  END IF;

  SELECT * INTO p FROM public.products
  WHERE id = p_product_id AND is_active
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  before_data := to_jsonb(p);

  UPDATE public.products
  SET low_stock_threshold = p_threshold
  WHERE id = p_product_id;

  SELECT * INTO p FROM public.products WHERE id = p_product_id;
  PERFORM public.log_owner_edit('stock_threshold', p_product_id, before_data, to_jsonb(p));
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_product_threshold(UUID, NUMERIC) TO authenticated;

-- 7. Update log_owner_edit to permit both super_admin and manager
CREATE OR REPLACE FUNCTION public.log_owner_edit(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_before JSONB,
  p_after JSONB
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager') AND is_active
  ) THEN
    RAISE EXCEPTION 'owner or manager access required';
  END IF;

  INSERT INTO public.owner_edit_log(actor_id, entity_type, entity_id, before_data, after_data)
  VALUES (auth.uid(), p_entity_type, p_entity_id, COALESCE(p_before, '{}'::JSONB), COALESCE(p_after, '{}'::JSONB));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_owner_edit(TEXT, UUID, JSONB, JSONB) TO authenticated;
