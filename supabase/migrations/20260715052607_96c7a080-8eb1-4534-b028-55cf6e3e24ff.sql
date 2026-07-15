-- Explicitly deny UPDATE and DELETE on security_logs for all non-service roles
CREATE POLICY "No updates to security logs"
ON public.security_logs
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No deletes from security logs"
ON public.security_logs
FOR DELETE
TO authenticated, anon
USING (false);