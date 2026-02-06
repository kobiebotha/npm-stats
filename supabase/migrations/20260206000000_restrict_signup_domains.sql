-- Restrict signups to @powersync.com and @journeyapps.com email domains
-- This is enforced server-side so it cannot be bypassed via the API

CREATE OR REPLACE FUNCTION public.check_allowed_email_domain()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
BEGIN
  email_domain := lower(split_part(NEW.email, '@', 2));

  IF email_domain NOT IN ('powersync.com', 'journeyapps.com') THEN
    RAISE EXCEPTION 'Signups are restricted to @powersync.com and @journeyapps.com email addresses';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_signup_email_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_allowed_email_domain();
