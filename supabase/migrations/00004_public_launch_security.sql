-- Public launch security: waitlist, usage tracking, quota enforcement.

-- ============================================
-- Waitlist Signups (email capture from landing page)
-- ============================================
CREATE TABLE waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS — writes go through service-role client only.
-- Anon/authenticated users cannot read or write this table.
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Usage Daily (per-org daily AI/voice usage tracking)
-- ============================================
CREATE TABLE usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  voice_minutes_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  ai_calls_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, date)
);

ALTER TABLE usage_daily ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_usage_daily_org_date ON usage_daily (organization_id, date DESC);

-- Org members can view their own usage
CREATE POLICY "Users can view own org usage"
  ON usage_daily FOR SELECT
  USING (organization_id = get_user_org_id());

-- ============================================
-- Add marketing opt-in to users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- Quota check function
-- ============================================
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
  -- Fetch org subscription status
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

  -- Check subscription status
  IF org_record.subscription_status = 'canceled' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Subscription canceled. Please reactivate to continue.'
    );
  END IF;

  -- Check trial expiry
  IF org_record.subscription_status = 'trial'
     AND org_record.trial_ends_at IS NOT NULL
     AND org_record.trial_ends_at < NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Free trial has expired. Upgrade to continue using voice and AI features.'
    );
  END IF;

  -- Set limits based on subscription
  IF org_record.subscription_status = 'active' THEN
    voice_limit := 500;
    ai_limit := 1000;
  ELSE
    -- Trial
    voice_limit := 30;
    ai_limit := 50;
  END IF;

  -- Fetch today's usage
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

-- ============================================
-- Usage increment function (atomic upsert)
-- ============================================
CREATE OR REPLACE FUNCTION increment_usage(
  org_id UUID,
  resource TEXT,
  amount NUMERIC DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF resource = 'voice' THEN
    INSERT INTO usage_daily (organization_id, date, voice_minutes_used)
    VALUES (org_id, CURRENT_DATE, amount)
    ON CONFLICT (organization_id, date)
    DO UPDATE SET voice_minutes_used = usage_daily.voice_minutes_used + amount;
  ELSIF resource = 'ai' THEN
    INSERT INTO usage_daily (organization_id, date, ai_calls_used)
    VALUES (org_id, CURRENT_DATE, amount)
    ON CONFLICT (organization_id, date)
    DO UPDATE SET ai_calls_used = usage_daily.ai_calls_used + amount;
  END IF;
END;
$$;

-- ============================================
-- Update handle_new_user to include marketing_opt_in
-- ============================================
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
