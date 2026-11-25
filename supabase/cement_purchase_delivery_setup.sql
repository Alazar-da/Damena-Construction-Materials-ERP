-- =====================================================================
-- DAMENA ERP: Cement Delivery & Stock Verification Setup
-- Adds bag count to cement expenses, delivery tracking, and approval RPC.
-- Protects cement purchase price from warehouse admin/store clerks.
-- =====================================================================

-- 1. Add columns to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'not_applicable' CHECK (delivery_status IN ('pending', 'delivered', 'not_applicable'));
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS verified_quantity NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS expenses_cement_delivery_idx ON public.expenses (delivery_status, category);

-- 2. Function to list pending OR partial (missing bags) cement deliveries WITHOUT exposing price/amount
DROP FUNCTION IF EXISTS public.get_pending_cement_deliveries();
CREATE OR REPLACE FUNCTION public.get_pending_cement_deliveries()
RETURNS TABLE (
  id UUID,
  expense_date DATE,
  item_name TEXT,
  quantity NUMERIC,
  verified_quantity NUMERIC,
  delivery_status TEXT,
  notes TEXT,
  recorded_by_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.expense_date,
    e.item_name,
    e.quantity,
    e.verified_quantity,
    e.delivery_status,
    e.notes,
    coalesce(p.display_name, 'ስራ አስኪያጅ') AS recorded_by_name,
    e.created_at
  FROM public.expenses e
  LEFT JOIN public.profiles p ON p.id = e.recorded_by
  WHERE e.category = 'production_materials'
    AND e.item_name ILIKE '%ሲሚንቶ%'
    AND (
      e.delivery_status = 'pending'
      OR (
        e.delivery_status = 'delivered'
        AND e.verified_quantity IS NOT NULL
        AND e.quantity IS NOT NULL
        AND e.verified_quantity < e.quantity
      )
    )
  ORDER BY e.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_cement_deliveries() TO authenticated;

-- 3. Function for store admin to count and approve cement into warehouse (supports follow-up for missing bags)
CREATE OR REPLACE FUNCTION public.approve_cement_delivery(
  p_expense_id UUID,
  p_counted_quantity NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exp RECORD;
  cement_prod RECORD;
  diff NUMERIC;
  is_followup BOOLEAN;
  new_verified_qty NUMERIC;
BEGIN
  PERFORM bootstrap_current_user();
  
  IF p_counted_quantity IS NULL OR p_counted_quantity <= 0 THEN
    RAISE EXCEPTION 'የተቆጠረው የሲሚንቶ ከረጢት ብዛት ከ0 በላይ መሆን አለበት።';
  END IF;

  SELECT * INTO exp FROM public.expenses WHERE id = p_expense_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'የተመረጠው የሲሚንቶ ግዢ መዝገብ አልተገኘም።';
  END IF;

  is_followup := (
    exp.delivery_status = 'delivered'
    AND exp.verified_quantity IS NOT NULL
    AND exp.quantity IS NOT NULL
    AND exp.verified_quantity < exp.quantity
  );

  IF exp.delivery_status = 'delivered' AND NOT is_followup THEN
    RAISE EXCEPTION 'ይህ የሲሚንቶ ግዢ ቀደም ሲል ሙሉ በሙሉ ተረጋግጦ ወደ መጋዘን ገብቷል።';
  END IF;

  SELECT * INTO cement_prod FROM public.products WHERE sku = 'CEMENT-50KG' AND is_active FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'የሲሚንቶ መጋዘን ምርት አልተገኘም።';
  END IF;

  -- Add the verified counted bags into warehouse stock
  UPDATE public.products
  SET stock_on_hand = stock_on_hand + p_counted_quantity
  WHERE id = cement_prod.id;

  IF is_followup THEN
    new_verified_qty := coalesce(exp.verified_quantity, 0) + p_counted_quantity;
    diff := new_verified_qty - coalesce(exp.quantity, new_verified_qty);

    INSERT INTO public.inventory_movements(product_id, quantity_delta, movement_type, reason)
    VALUES (
      cement_prod.id,
      p_counted_quantity,
      'receipt',
      'ተጨማሪ ቆጠራ (+' || p_counted_quantity || ' ከረጢት)' || CASE WHEN p_notes IS NOT NULL AND p_notes <> '' THEN ' - ' || p_notes ELSE '' END
    );

    UPDATE public.expenses
    SET
      verified_quantity = new_verified_qty,
      notes = CASE 
        WHEN p_notes IS NOT NULL AND p_notes <> '' THEN
          coalesce(nullif(notes, '') || ' · ', '') || '[ተጨማሪ ቆጠራ፦ +' || p_counted_quantity || ' ከረጢት - ' || p_notes || ']'
        ELSE
          coalesce(nullif(notes, '') || ' · ', '') || '[ተጨማሪ ቆጠራ፦ +' || p_counted_quantity || ' ከረጢት]'
      END,
      verified_by = auth.uid(),
      verified_at = now()
    WHERE id = exp.id;
  ELSE
    new_verified_qty := p_counted_quantity;
    diff := p_counted_quantity - coalesce(exp.quantity, p_counted_quantity);

    INSERT INTO public.inventory_movements(product_id, quantity_delta, movement_type, reason)
    VALUES (
      cement_prod.id,
      p_counted_quantity,
      'receipt',
      coalesce(p_notes, 'ከግዢ የተረጋገጠ ሲሚንቶ') || CASE WHEN diff < 0 THEN ' (' || abs(diff) || ' ከረጢት ጉድለት ተገኝቷል)' ELSE '' END
    );

    UPDATE public.expenses
    SET
      delivery_status = 'delivered',
      verified_quantity = p_counted_quantity,
      notes = CASE 
        WHEN p_notes IS NOT NULL AND p_notes <> '' THEN
          coalesce(nullif(notes, '') || ' · ', '') || '[ቆጠራ፦ ' || p_notes || ']'
        WHEN diff < 0 THEN
          coalesce(nullif(notes, '') || ' · ', '') || '[ቆጠራ፦ ' || abs(diff) || ' ከረጢት ጉድለት]'
        ELSE notes
      END,
      verified_by = auth.uid(),
      verified_at = now()
    WHERE id = exp.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'added_bags', p_counted_quantity,
    'total_verified', new_verified_qty,
    'difference', diff
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_cement_delivery(UUID, NUMERIC, TEXT) TO authenticated;

-- 4. Function to sync inventory_movements reason when manager edits cement quantity
CREATE OR REPLACE FUNCTION public.sync_cement_movement_for_expense(
  p_expense_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exp RECORD;
  cement_prod RECORD;
  target_mov RECORD;
  diff NUMERIC;
  new_reason TEXT;
BEGIN
  SELECT * INTO exp FROM public.expenses WHERE id = p_expense_id;
  IF NOT FOUND OR exp.delivery_status <> 'delivered' OR exp.verified_quantity IS NULL OR exp.quantity IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO cement_prod FROM public.products WHERE sku = 'CEMENT-50KG' AND is_active LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT * INTO target_mov
  FROM public.inventory_movements
  WHERE product_id = cement_prod.id
    AND movement_type = 'receipt'
    AND (
      (exp.verified_at IS NOT NULL AND abs(extract(epoch from (created_at - exp.verified_at))) <= 120)
      OR quantity_delta = exp.verified_quantity
      OR reason ILIKE '%ጉድለት%'
    )
  ORDER BY
    CASE WHEN exp.verified_at IS NOT NULL THEN abs(extract(epoch from (created_at - exp.verified_at))) ELSE 999999 END ASC,
    created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  diff := exp.verified_quantity - exp.quantity;
  IF diff = 0 THEN
    new_reason := 'ከግዢ የተረጋገጠ ሲሚንቶ (ሙሉ ገብቷል — በስራ አስኪያጅ ተስተካክሏል)';
  ELSIF diff < 0 THEN
    new_reason := 'ከግዢ የተረጋገጠ ሲሚንቶ (' || abs(diff) || ' ከረጢት ጉድለት ተገኝቷል)';
  ELSE
    new_reason := 'ከግዢ የተረጋገጠ ሲሚንቶ (+' || diff || ' ከረጢት ትርፍ)';
  END IF;

  UPDATE public.inventory_movements
  SET reason = new_reason
  WHERE id = target_mov.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_cement_movement_for_expense(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.approve_cement_delivery(UUID, NUMERIC, TEXT) TO authenticated;
