ALTER TABLE public.installed_packages
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS installed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Keep the table reachable after the schema change
GRANT SELECT, INSERT, UPDATE, DELETE ON public.installed_packages TO authenticated;
GRANT ALL ON public.installed_packages TO service_role;