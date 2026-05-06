
-- 1. Replace permissive (true) RLS policies with auth-checked equivalents

-- blocked_ips
DROP POLICY IF EXISTS "Authenticated users can insert blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "Authenticated users can delete blocked IPs" ON public.blocked_ips;
CREATE POLICY "Authenticated users can insert blocked IPs"
  ON public.blocked_ips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete blocked IPs"
  ON public.blocked_ips FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- firewall_logs
DROP POLICY IF EXISTS "Authenticated users can insert firewall logs" ON public.firewall_logs;
CREATE POLICY "Authenticated users can insert firewall logs"
  ON public.firewall_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- security_incidents
DROP POLICY IF EXISTS "Authenticated users can insert incidents" ON public.security_incidents;
DROP POLICY IF EXISTS "Authenticated users can update incidents" ON public.security_incidents;
CREATE POLICY "Authenticated users can insert incidents"
  ON public.security_incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update incidents"
  ON public.security_incidents FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- threat_alerts
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.threat_alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.threat_alerts;
CREATE POLICY "Authenticated users can insert alerts"
  ON public.threat_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update alerts"
  ON public.threat_alerts FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 2. Revoke public/anon EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
