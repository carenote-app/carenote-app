-- Shorten the free trial from 14 days to 3 days for new signups.
-- Existing organizations keep whatever trial_ends_at they were assigned.

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
    NOW() + INTERVAL '3 days'
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.users (id, organization_id, email, full_name, role, marketing_opt_in)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin',
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the human-facing message in check_org_quota so it points users
-- to the new email-for-pricing flow rather than implying self-serve upgrade.
CREATE OR REPLACE FUNCTION check_org_quota(org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_record RECORD;
  usage_record RECORD;
  voice_limit NUMERIC;
  ai_limit INTEGER;
  voice_remaining NUMERIC;
  ai_remaining INTEGER;
BEGIN
  SELECT subscription_status, trial_ends_at
  INTO org_record
  FROM organizations
  WHERE id = org_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Organization not found'
    );
  END IF;

  IF org_record.subscription_status = 'canceled' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Subscription canceled. Email us to reactivate your account.'
    );
  END IF;

  IF org_record.subscription_status = 'trial'
     AND org_record.trial_ends_at IS NOT NULL
     AND org_record.trial_ends_at < NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Free trial has expired. Email us for pricing to continue using voice and AI features.'
    );
  END IF;

  IF org_record.subscription_status = 'active' THEN
    voice_limit := 500;
    ai_limit := 1000;
  ELSE
    voice_limit := 30;
    ai_limit := 50;
  END IF;

  SELECT voice_minutes_used, ai_calls_used
  INTO usage_record
  FROM usage_daily
  WHERE organization_id = org_id AND date = CURRENT_DATE;

  IF NOT FOUND THEN
    voice_remaining := voice_limit;
    ai_remaining := ai_limit;
  ELSE
    voice_remaining := voice_limit - usage_record.voice_minutes_used;
    ai_remaining := ai_limit - usage_record.ai_calls_used;
  END IF;

  IF voice_remaining <= 0 OR ai_remaining <= 0 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily usage limit reached. Limits reset at midnight UTC.',
      'voice_minutes_remaining', GREATEST(voice_remaining, 0),
      'ai_calls_remaining', GREATEST(ai_remaining, 0)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'voice_minutes_remaining', voice_remaining,
    'ai_calls_remaining', ai_remaining
  );
END;
$$;
