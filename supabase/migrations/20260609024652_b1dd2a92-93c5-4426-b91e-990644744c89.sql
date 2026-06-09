
-- blocked_ips: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can delete blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "Authenticated users can insert blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "Authenticated users can read blocked IPs" ON public.blocked_ips;

CREATE POLICY "Admins can insert blocked IPs" ON public.blocked_ips
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update blocked IPs" ON public.blocked_ips
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete blocked IPs" ON public.blocked_ips
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Authenticated can read blocked IPs" ON public.blocked_ips
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- firewall_logs: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert firewall logs" ON public.firewall_logs;
CREATE POLICY "Admins can insert firewall logs" ON public.firewall_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update firewall logs" ON public.firewall_logs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete firewall logs" ON public.firewall_logs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- security_incidents: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert incidents" ON public.security_incidents;
DROP POLICY IF EXISTS "Authenticated users can update incidents" ON public.security_incidents;
CREATE POLICY "Admins can insert incidents" ON public.security_incidents
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update incidents" ON public.security_incidents
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete incidents" ON public.security_incidents
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- threat_alerts: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.threat_alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.threat_alerts;
CREATE POLICY "Admins can insert alerts" ON public.threat_alerts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update alerts" ON public.threat_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete alerts" ON public.threat_alerts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Realtime channel authorization: only admins may subscribe/broadcast
DROP POLICY IF EXISTS "Admins can receive realtime broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can send realtime broadcasts" ON realtime.messages;
CREATE POLICY "Admins can receive realtime broadcasts" ON realtime.messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can send realtime broadcasts" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- SECURITY DEFINER hardening
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
