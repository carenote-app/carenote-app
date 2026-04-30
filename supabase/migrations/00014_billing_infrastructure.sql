-- Salvage from PR #27 (Track G): the infrastructure pieces of the
-- two-tier billing plan, decoupled from the public-facing pricing UI
-- (which we're holding back per current product direction — see PR #28
-- "Hide pricing, shorten trial to 3 days").
--
-- This migration adds:
--   1. organizations.bed_count          — admin-set facility size (1..99)
--   2. organizations.subscription_tier  — derived from bed_count (small/standard/enterprise)
--   3. stripe_processed_events          — webhook dedupe table
--
-- What is intentionally NOT in this migration (vs. the original PR #27):
--   - billing_emails_sent column         (no trial-reminder cron yet)
--   - handle_new_user() rewrite          (00013 already sets the 3-day trial)
--
-- bed_count has no UI surface yet; an admin-only API can set it later
-- when we re-engage the pricing question. The generated subscription_tier
-- column makes the "21+ beds = custom plan" boundary cheap to query.

-- 1. Bed count + derived tier on organizations.
ALTER TABLE organizations
  ADD COLUMN bed_count INTEGER
    CHECK (bed_count IS NULL OR (bed_count >= 1 AND bed_count <= 99));

-- subscription_tier is derived: 1-10 = small, 11-20 = standard, 21+ = enterprise.
-- 'enterprise' is a sentinel for the "Contact us for 21+ beds" path; checkout
-- can refuse to subscribe enterprise tier and surface a contact CTA instead.
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

-- 2. Stripe webhook event dedupe.
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

-- 3. Read access on bed_count / subscription_tier for org admins.
-- The existing organizations RLS already permits authenticated users to
-- SELECT their own org row, so the new columns are visible automatically.
-- No new policies required.
