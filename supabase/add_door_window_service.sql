-- =====================================================================
-- DAMENA ERP: Add 'door_window' (በር እና መስኮት) to Service Payments
-- Run this in the Supabase SQL Editor once.
-- =====================================================================

-- 1. Update the check constraint on service_payments table
ALTER TABLE public.service_payments 
  DROP CONSTRAINT IF EXISTS service_payments_service_type_check;

ALTER TABLE public.service_payments 
  ADD CONSTRAINT service_payments_service_type_check 
  CHECK (service_type IN ('battery_acid', 'battery_charging', 'welding', 'door_window'));

-- 2. Update owner_update_service_payment function
CREATE OR REPLACE FUNCTION public.owner_update_service_payment(
  p_id uuid,
  p_service_type text,
  p_customer_name text,
  p_amount numeric,
  p_notes text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.service_payments%rowtype;
  before_data jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active
  ) THEN 
    RAISE EXCEPTION 'owner access required'; 
  END IF;

  IF p_service_type NOT IN ('battery_charging', 'battery_acid', 'welding', 'door_window') THEN 
    RAISE EXCEPTION 'invalid service'; 
  END IF;

  IF p_amount IS NULL OR p_amount < 0 THEN 
    RAISE EXCEPTION 'amount cannot be negative'; 
  END IF;

  SELECT * INTO r FROM public.service_payments WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'service payment not found'; 
  END IF;

  before_data := to_jsonb(r);

  UPDATE public.service_payments 
  SET service_type = p_service_type,
      customer_name = nullif(trim(p_customer_name), ''),
      amount = p_amount,
      notes = p_notes 
  WHERE id = p_id;

  SELECT * INTO r FROM public.service_payments WHERE id = p_id;
  PERFORM public.log_owner_edit('service_payment', p_id, before_data, to_jsonb(r));
END;
$$;
