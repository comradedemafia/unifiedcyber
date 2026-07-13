-- Recreate audit enum if it was dropped
DO $$ BEGIN
  CREATE TYPE public.audit_level AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- security_logs table (dropped by previous destructive migration)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  severity public.audit_level NOT NULL DEFAULT 'info',
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  source_system TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_logs TO authenticated;
GRANT ALL ON public.security_logs TO service_role;

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.security_logs;
CREATE POLICY "Users can view own audit logs" ON public.security_logs
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_logs;
CREATE POLICY "Service role can insert audit logs" ON public.security_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update audit logs" ON public.security_logs;
CREATE POLICY "Service role can update audit logs" ON public.security_logs
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id, event_type, action, resource_type, resource_id, severity, status, details
  )
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP
      WHEN 'DELETE' THEN 'critical'::public.audit_level
      WHEN 'UPDATE' THEN 'warning'::public.audit_level
      ELSE 'info'::public.audit_level
    END,
    'success',
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_security_incidents ON public.security_incidents;
CREATE TRIGGER audit_security_incidents
  AFTER INSERT OR UPDATE OR DELETE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

DROP TRIGGER IF EXISTS audit_firewall_logs ON public.firewall_logs;
CREATE TRIGGER audit_firewall_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.firewall_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

DROP TRIGGER IF EXISTS audit_threat_alerts ON public.threat_alerts;
CREATE TRIGGER audit_threat_alerts
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_alerts
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

DROP TRIGGER IF EXISTS audit_blocked_ips ON public.blocked_ips;
CREATE TRIGGER audit_blocked_ips
  AFTER INSERT OR UPDATE OR DELETE ON public.blocked_ips
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

-- Helper RPC functions
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_event_type TEXT DEFAULT NULL,
  p_severity public.audit_level DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID, user_id UUID, event_type TEXT, action TEXT, resource_type TEXT,
  resource_id UUID, severity public.audit_level, status TEXT, details JSONB,
  ip_address TEXT, created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT sl.id, sl.user_id, sl.event_type, sl.action, sl.resource_type, sl.resource_id,
         sl.severity, sl.status, sl.details, sl.ip_address, sl.created_at
  FROM public.security_logs sl
  WHERE (p_event_type IS NULL OR sl.event_type = p_event_type)
    AND (p_severity IS NULL OR sl.severity = p_severity)
  ORDER BY sl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_event_type TEXT, p_status TEXT, p_details JSONB, p_ip_address TEXT, p_user_agent TEXT
)
RETURNS uuid AS $$
DECLARE v_log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    user_id, event_type, action, severity, status, details, ip_address, user_agent, source_system
  )
  VALUES (
    auth.uid(), 'authentication', p_event_type,
    CASE WHEN p_status = 'failed' THEN 'critical'::public.audit_level ELSE 'info'::public.audit_level END,
    p_status, p_details, p_ip_address, p_user_agent, 'auth-system'
  )
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT, p_action TEXT, p_resource_type TEXT DEFAULT NULL, p_resource_id UUID DEFAULT NULL,
  p_severity public.audit_level DEFAULT 'info', p_status TEXT DEFAULT 'success',
  p_details JSONB DEFAULT '{}'::jsonb, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL,
  p_source_system TEXT DEFAULT 'web-client'
)
RETURNS uuid AS $$
DECLARE v_log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    user_id, event_type, action, resource_type, resource_id, severity, status, details,
    ip_address, user_agent, source_system
  )
  VALUES (
    auth.uid(), p_event_type, p_action, COALESCE(p_resource_type, 'system'), p_resource_id,
    p_severity, p_status, p_details, p_ip_address, p_user_agent, p_source_system
  )
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_event TO anon;
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event TO anon;

-- Missing tables used by the terminal and encryption UI
CREATE TABLE IF NOT EXISTS public.encryption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  algorithm TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.encryption_events TO authenticated;
GRANT ALL ON public.encryption_events TO service_role;
ALTER TABLE public.encryption_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage encryption events" ON public.encryption_events;
CREATE POLICY "Authenticated users can manage encryption events" ON public.encryption_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.installed_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.installed_packages TO authenticated;
GRANT ALL ON public.installed_packages TO service_role;
ALTER TABLE public.installed_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage installed packages" ON public.installed_packages;
CREATE POLICY "Authenticated users can manage installed packages" ON public.installed_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.file_store (
  path TEXT PRIMARY KEY,
  content TEXT,
  permissions TEXT,
  owner TEXT,
  size INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_store TO authenticated;
GRANT ALL ON public.file_store TO service_role;
ALTER TABLE public.file_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage file store" ON public.file_store;
CREATE POLICY "Authenticated users can manage file store" ON public.file_store FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.terminal_files (
  path TEXT PRIMARY KEY,
  content TEXT,
  owner TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terminal_files TO authenticated;
GRANT ALL ON public.terminal_files TO service_role;
ALTER TABLE public.terminal_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage terminal files" ON public.terminal_files;
CREATE POLICY "Authenticated users can manage terminal files" ON public.terminal_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.script_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script TEXT NOT NULL,
  args TEXT,
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.script_runs TO authenticated;
GRANT ALL ON public.script_runs TO service_role;
ALTER TABLE public.script_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage script runs" ON public.script_runs;
CREATE POLICY "Authenticated users can manage script runs" ON public.script_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Idempotent Data-API grants for all existing public tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_incidents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firewall_logs TO authenticated;
GRANT ALL ON public.firewall_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threat_alerts TO authenticated;
GRANT ALL ON public.threat_alerts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_ips TO authenticated;
GRANT ALL ON public.blocked_ips TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terminal_audit_log TO authenticated;
GRANT ALL ON public.terminal_audit_log TO service_role;

-- Realtime for tables that stream to the UI
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.encryption_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.file_store;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_files;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.script_runs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.installed_packages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;