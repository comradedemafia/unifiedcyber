-- Create assign_role_for_signup RPC to allow service-role to assign roles safely

CREATE OR REPLACE FUNCTION public.assign_role_for_signup(
  _user_id uuid,
  _role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role or admins to call this function
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Validate role
  IF _role NOT IN ('admin','moderator','user') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  -- Insert role if not exists
  INSERT INTO public.user_roles (user_id, role)
  SELECT _user_id, _role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_role_for_signup(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_role_for_signup(uuid, public.app_role) TO authenticated;
