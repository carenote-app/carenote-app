-- Harden RLS helper functions and signup trigger by pinning search_path.
-- Without SET search_path, a SECURITY DEFINER function can be tricked into
-- resolving object names through a malicious schema. See docs/SECURITY.md.

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, type, timezone, trial_ends_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'facility_name', 'My Facility'),
    COALESCE(NEW.raw_user_meta_data->>'facility_type', 'rcfe'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Los_Angeles'),
    NOW() + INTERVAL '14 days'
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.users (id, organization_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
