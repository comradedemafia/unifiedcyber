
-- Fix overly permissive RLS policies

-- file_store: scope to owner
DROP POLICY IF EXISTS "Authenticated users can manage file store" ON public.file_store;
CREATE POLICY "Users can view own files" ON public.file_store FOR SELECT TO authenticated USING (owner = (auth.uid())::text);
CREATE POLICY "Users can insert own files" ON public.file_store FOR INSERT TO authenticated WITH CHECK (owner = (auth.uid())::text);
CREATE POLICY "Users can update own files" ON public.file_store FOR UPDATE TO authenticated USING (owner = (auth.uid())::text) WITH CHECK (owner = (auth.uid())::text);
CREATE POLICY "Users can delete own files" ON public.file_store FOR DELETE TO authenticated USING (owner = (auth.uid())::text);
CREATE POLICY "Admins can manage all files" ON public.file_store FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- terminal_files: scope to owner
DROP POLICY IF EXISTS "Authenticated users can manage terminal files" ON public.terminal_files;
CREATE POLICY "Users can view own terminal files" ON public.terminal_files FOR SELECT TO authenticated USING (owner = (auth.uid())::text);
CREATE POLICY "Users can insert own terminal files" ON public.terminal_files FOR INSERT TO authenticated WITH CHECK (owner = (auth.uid())::text);
CREATE POLICY "Users can update own terminal files" ON public.terminal_files FOR UPDATE TO authenticated USING (owner = (auth.uid())::text) WITH CHECK (owner = (auth.uid())::text);
CREATE POLICY "Users can delete own terminal files" ON public.terminal_files FOR DELETE TO authenticated USING (owner = (auth.uid())::text);
CREATE POLICY "Admins can manage all terminal files" ON public.terminal_files FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- encryption_events: read for authenticated, writes admin-only
DROP POLICY IF EXISTS "Authenticated users can manage encryption events" ON public.encryption_events;
CREATE POLICY "Authenticated can view encryption events" ON public.encryption_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can modify encryption events" ON public.encryption_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- installed_packages: shared read, admin-only write
DROP POLICY IF EXISTS "Authenticated users can manage installed packages" ON public.installed_packages;
CREATE POLICY "Authenticated can view installed packages" ON public.installed_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can modify installed packages" ON public.installed_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- script_runs: read for authenticated, writes admin-only (no user_id column)
DROP POLICY IF EXISTS "Authenticated users can manage script runs" ON public.script_runs;
CREATE POLICY "Authenticated can view script runs" ON public.script_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can modify script runs" ON public.script_runs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- security_logs: remove null user_id exposure
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.security_logs;
CREATE POLICY "Users can view own audit logs" ON public.security_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON public.security_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Fix function search_path on get_audit_logs
CREATE OR REPLACE FUNCTION public.get_audit_logs(p_event_type text DEFAULT NULL::text, p_severity public.audit_level DEFAULT NULL::public.audit_level, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, user_id uuid, event_type text, action text, resource_type text, resource_id uuid, severity public.audit_level, status text, details jsonb, ip_address text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Revoke anon execute on SECURITY DEFINER functions not meant to be public
REVOKE EXECUTE ON FUNCTION public.audit_security_event() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_auth_event(text, text, jsonb, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, text, uuid, public.audit_level, text, jsonb, text, text, text) FROM anon, PUBLIC;
