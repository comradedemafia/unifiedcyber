
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create security_incidents table
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  source_ip TEXT,
  target TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'detected',
  response_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read incidents" ON public.security_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert incidents" ON public.security_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update incidents" ON public.security_incidents FOR UPDATE TO authenticated USING (true);

-- Create firewall_logs table
CREATE TABLE public.firewall_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_ip TEXT NOT NULL,
  destination_ip TEXT,
  port INTEGER,
  protocol TEXT DEFAULT 'TCP',
  action TEXT NOT NULL DEFAULT 'blocked',
  threat_type TEXT,
  rule_matched TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.firewall_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read firewall logs" ON public.firewall_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert firewall logs" ON public.firewall_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Create threat_alerts table
CREATE TABLE public.threat_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  source_ip TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.threat_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alerts" ON public.threat_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON public.threat_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alerts" ON public.threat_alerts FOR UPDATE TO authenticated USING (true);

-- Create blocked_ips table
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by TEXT DEFAULT 'system',
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read blocked IPs" ON public.blocked_ips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert blocked IPs" ON public.blocked_ips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete blocked IPs" ON public.blocked_ips FOR DELETE TO authenticated USING (true);

-- Enable realtime for threat_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.threat_alerts;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
