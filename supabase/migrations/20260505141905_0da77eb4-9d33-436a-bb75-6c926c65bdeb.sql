CREATE TABLE public.terminal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  event_type TEXT NOT NULL, -- 'real_command' | 'threshold_breach' | 'rate_limit'
  command TEXT,
  target TEXT,
  result TEXT, -- 'success' | 'blocked' | 'error'
  severity TEXT NOT NULL DEFAULT 'info',
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.terminal_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit events"
ON public.terminal_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert their own audit events"
ON public.terminal_audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX idx_terminal_audit_created ON public.terminal_audit_log (created_at DESC);
CREATE INDEX idx_terminal_audit_event ON public.terminal_audit_log (event_type);