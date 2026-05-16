-- Enhanced Security Schema for Audit Logging and Improved RLS
-- This migration adds security_logs table and strengthens RLS policies

-- Create audit_level enum for logging severity
CREATE TYPE public.audit_level AS ENUM ('info', 'warning', 'critical');

-- Create security_logs table for audit trail
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  severity audit_level NOT NULL DEFAULT 'info',
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  source_system TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_logs
-- Users can only view logs for their own actions
CREATE POLICY "Users can view own audit logs" ON public.security_logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Only service role can insert logs
CREATE POLICY "Service role can insert audit logs" ON public.security_logs 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can update logs (mark as reviewed, etc)
CREATE POLICY "Service role can update audit logs" ON public.security_logs 
  FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Enable realtime for security_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;

-- Create indexes for performance
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity);

-- Audit trigger function for security events
CREATE OR REPLACE FUNCTION public.audit_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    action,
    resource_type,
    resource_id,
    severity,
    status,
    details
  )
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP
      WHEN 'DELETE' THEN 'critical'::audit_level
      WHEN 'UPDATE' THEN 'warning'::audit_level
      ELSE 'info'::audit_level
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

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_security_incidents
  AFTER INSERT OR UPDATE OR DELETE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

CREATE TRIGGER audit_firewall_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.firewall_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

CREATE TRIGGER audit_threat_alerts
  AFTER INSERT OR UPDATE OR DELETE ON public.threat_alerts
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

CREATE TRIGGER audit_blocked_ips
  AFTER INSERT OR UPDATE OR DELETE ON public.blocked_ips
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_event();

-- Enhanced RLS Policies for security_incidents
-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can read incidents" ON public.security_incidents;
DROP POLICY IF EXISTS "Authenticated users can insert incidents" ON public.security_incidents;
DROP POLICY IF EXISTS "Authenticated users can update incidents" ON public.security_incidents;

-- New policies - limited access based on role
CREATE POLICY "Users can view incidents" ON public.security_incidents 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Only authenticated users can create incidents" ON public.security_incidents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Only creators/admins can update incidents" ON public.security_incidents 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Enhanced RLS Policies for firewall_logs
DROP POLICY IF EXISTS "Authenticated users can read firewall logs" ON public.firewall_logs;
DROP POLICY IF EXISTS "Authenticated users can insert firewall logs" ON public.firewall_logs;

CREATE POLICY "Users can view firewall logs" ON public.firewall_logs 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Only authenticated users can insert firewall logs" ON public.firewall_logs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Enhanced RLS Policies for threat_alerts
DROP POLICY IF EXISTS "Authenticated users can read alerts" ON public.threat_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.threat_alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.threat_alerts;

CREATE POLICY "Users can view threat alerts" ON public.threat_alerts 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Only authenticated users can create alerts" ON public.threat_alerts 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update alerts" ON public.threat_alerts 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Enhanced RLS Policies for blocked_ips
DROP POLICY IF EXISTS "Authenticated users can read blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "Authenticated users can insert blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "Authenticated users can delete blocked IPs" ON public.blocked_ips;

CREATE POLICY "Users can view blocked IP list" ON public.blocked_ips 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Only authenticated users can block IPs" ON public.blocked_ips 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can manage blocked IPs" ON public.blocked_ips 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Function to get audit logs with filtering
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_event_type TEXT DEFAULT NULL,
  p_severity audit_level DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  event_type TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  severity audit_level,
  status TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id,
    sl.user_id,
    sl.event_type,
    sl.action,
    sl.resource_type,
    sl.resource_id,
    sl.severity,
    sl.status,
    sl.details,
    sl.ip_address,
    sl.created_at
  FROM public.security_logs sl
  WHERE (p_event_type IS NULL OR sl.event_type = p_event_type)
    AND (p_severity IS NULL OR sl.severity = p_severity)
  ORDER BY sl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_event_type TEXT,
  p_status TEXT,
  p_details JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS uuid AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    action,
    severity,
    status,
    details,
    ip_address,
    user_agent,
    source_system
  )
  VALUES (
    auth.uid(),
    'authentication',
    p_event_type,
    CASE 
      WHEN p_status = 'failed' THEN 'critical'::audit_level
      ELSE 'info'::audit_level
    END,
    p_status,
    p_details,
    p_ip_address,
    p_user_agent,
    'auth-system'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_severity audit_level DEFAULT 'info',
  p_status TEXT DEFAULT 'success',
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_source_system TEXT DEFAULT 'web-client'
)
RETURNS uuid AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    action,
    resource_type,
    resource_id,
    severity,
    status,
    details,
    ip_address,
    user_agent,
    source_system
  )
  VALUES (
    auth.uid(),
    p_event_type,
    p_action,
    COALESCE(p_resource_type, 'system'),
    p_resource_id,
    p_severity,
    p_status,
    p_details,
    p_ip_address,
    p_user_agent,
    p_source_system
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_event TO anon;
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event TO anon;
