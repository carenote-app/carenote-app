-- Phase 11: PDPA consent capture (Taiwan Personal Data Protection Act).
-- Append-only ledger of consent acknowledgments. Used at signup for
-- regulatory_region='pdpa_tw' orgs to record cross-border-transfer notice
-- acknowledgment, and annually for renewal. Designed so admins can prove
-- consent was captured if a regulator asks.
--
-- Append-only is enforced by RLS: SELECT for admins, INSERT for any authed
-- user (so signup flow can record before user is fully bound to org), and
-- NO UPDATE or DELETE policies (effectively immutable).

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Nullable so we can record org-level consents (e.g., owner accepting
  -- cross-border transfer terms before any users are added).
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_consent_records_org_type_version
  ON consent_records (organization_id, consent_type, consent_version, accepted_at DESC);
CREATE INDEX idx_consent_records_user
  ON consent_records (user_id, accepted_at DESC)
  WHERE user_id IS NOT NULL;

-- Admins can audit consent for their own org.
CREATE POLICY "Admins can view org consent records"
  ON consent_records FOR SELECT
  USING (organization_id = get_user_org_id() AND is_admin());

-- A user can also see their own consent records (for "data subject" access).
CREATE POLICY "Users can view own consent records"
  ON consent_records FOR SELECT
  USING (user_id = auth.uid());

-- Authenticated users can record their own consent. Signup flow uses this
-- pre-org-binding by setting user_id = auth.uid() and organization_id from
-- the invite/signup context.
CREATE POLICY "Users can insert own consent"
  ON consent_records FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- No UPDATE or DELETE policies — append-only by design.
