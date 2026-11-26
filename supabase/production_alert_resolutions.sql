-- =====================================================================
-- DAMENA ERP: Production Shortage Alert Resolutions
-- Allows Manager and Owner to acknowledge & dismiss resolved production
-- shortage alerts so they don't stay permanently red on dashboards/reports.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.production_alert_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key TEXT NOT NULL,
  product_key TEXT NOT NULL,
  resolution_note TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period_key, product_key)
);

CREATE INDEX IF NOT EXISTS prod_alert_resolutions_period_idx
  ON public.production_alert_resolutions (period_key, product_key);

ALTER TABLE public.production_alert_resolutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prod_alert_resolutions_read ON public.production_alert_resolutions;
CREATE POLICY prod_alert_resolutions_read ON public.production_alert_resolutions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS prod_alert_resolutions_write ON public.production_alert_resolutions;
CREATE POLICY prod_alert_resolutions_write ON public.production_alert_resolutions
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

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.production_alert_resolutions TO authenticated;
GRANT ALL ON TABLE public.production_alert_resolutions TO service_role;

NOTIFY pgrst, 'reload schema';
