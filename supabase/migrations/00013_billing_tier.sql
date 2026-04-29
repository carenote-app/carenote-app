-- Track G: two-tier billing schema.
--
-- Introduces a per-organization bed_count (1..99) and a derived
-- subscription_tier ('small' | 'standard' | 'enterprise') used at
-- Stripe checkout to pick between two price IDs. Also adds a
-- billing_emails_sent JSONB so the trial-ending Inngest cron can be
-- idempotent without a separate events table, and a
-- stripe_processed_events table so the webhook handler can dedupe
-- Stripe retries.
--
-- Existing orgs without bed_count are unaffected; the application
-- gates the Subscribe action until bed_count is filled in.

-- 1. Bed count + derived tier on organizations.
ALTER TABLE organizations
  ADD COLUMN bed_count INTEGER
    CHECK (bed_count IS NULL OR (bed_count >= 1 AND bed_count <= 99));

-- subscription_tier is derived: 1-10 = small, 11-20 = standard, 21+ = enterprise.
-- 'enterprise' is a sentinel for the "Contact us for 21+ beds" path; checkout
-- refuses to subscribe enterprise tier and surfaces a contact CTA instead.
-- Stored generated columns let us index it cheaply if we ever need to.
ALTER TABLE organizations
  ADD COLUMN subscription_tier TEXT
    GENERATED ALWAYS AS (
      CASE
        WHEN bed_count IS NULL THEN NULL
        WHEN bed_count <= 10 THEN 'small'
        WHEN bed_count <= 20 THEN 'standard'
        ELSE 'enterprise'
      END
    ) STORED;

-- 2. billing_emails_sent: idempotency log for the trial-ending cron.
-- Shape: { "trial_7_day": "2026-04-28T09:00:00Z" | null, "trial_1_day": ..., "trial_expired": ... }
-- The cron checks each key before sending and writes the timestamp on send.
ALTER TABLE organizations
  ADD COLUMN billing_emails_sent JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Stripe webhook event dedupe.
-- Stripe retries webhook deliveries on non-2xx responses (and sometimes on
-- transient successes). Without dedupe, retries can re-flap subscription
-- status or double-fire side effects. We record processed event ids so the
-- handler can short-circuit on retry.
CREATE TABLE stripe_processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Old rows are not useful after Stripe's retry window; keep for ~90 days
-- of audit trail. A scheduled job can prune later if the table grows.
CREATE INDEX idx_stripe_processed_events_processed_at
  ON stripe_processed_events (processed_at);

-- RLS: webhook uses the service role; no anon/auth access needed.
ALTER TABLE stripe_processed_events ENABLE ROW LEVEL SECURITY;
-- No policies = no access via the user-scoped client. Service role bypasses.

-- 4. Read access on bed_count / subscription_tier for org admins.
-- The existing organizations RLS already permits authenticated users to
-- SELECT their own org row, so the new columns are visible automatically.
-- No new policies required.

-- 5. handle_new_user trigger update: read bed_count from raw_user_meta_data.
-- The signup form passes the value via supabase.auth.signUp({ options: {
-- data: { bed_count: 8, ... } } }); the trigger reads it here. NULL is
-- allowed so existing flows that don't yet pass it keep working.
-- Preserves the marketing_opt_in handling added in 00004 and the
-- search_path = public hardening from 00002.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  meta_bed_count INTEGER;
BEGIN
  -- Parse bed_count from metadata if present and within range.
  BEGIN
    meta_bed_count := (NEW.raw_user_meta_data ->> 'bed_count')::INTEGER;
    IF meta_bed_count IS NOT NULL AND (meta_bed_count < 1 OR meta_bed_count > 99) THEN
      meta_bed_count := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    meta_bed_count := NULL;
  END;

  INSERT INTO public.organizations (name, type, timezone, trial_ends_at, bed_count)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'facility_name', 'My Facility'),
    COALESCE(NEW.raw_user_meta_data ->> 'facility_type', 'rcfe'),
    COALESCE(NEW.raw_user_meta_data ->> 'timezone', 'America/Los_Angeles'),
    NOW() + INTERVAL '14 days',
    meta_bed_count
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.users (id, organization_id, email, full_name, role, marketing_opt_in)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'admin',
    COALESCE((NEW.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
