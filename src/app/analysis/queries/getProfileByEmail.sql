CREATE OR REPLACE FUNCTION public.get_profile_by_email(lookup_email text)
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, email FROM public.profiles WHERE email = lookup_email LIMIT 1;
$$;
 