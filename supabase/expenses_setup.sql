-- =====================================================================
-- DAMENA ERP: Expenses ("ወጪ") Table & Permissions Setup
-- Accessible ONLY by Manager ('manager') and Owner ('super_admin').
-- Run once in the Supabase SQL Editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('production_materials', 'workshop_services', 'other')),
  item_name TEXT NOT NULL CHECK (nullif(trim(item_name), '') IS NOT NULL),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses (expense_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses (category);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expenses_manager_owner_all ON public.expenses;
CREATE POLICY expenses_manager_owner_all ON public.expenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'super_admin')
        AND is_active
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('manager', 'super_admin')
        AND is_active
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expenses TO authenticated;
GRANT ALL ON TABLE public.expenses TO service_role;
