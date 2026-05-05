-- Drop permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert their own audit events" ON public.terminal_audit_log;

-- Admin-only insert
CREATE POLICY "Admins can insert audit events"
ON public.terminal_audit_log FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER TABLE public.terminal_audit_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.terminal_audit_log;