-- Phase 11: Async clarifying-question back-channel from clinician portal to caregiver.
-- The existing clinician_share_links portal is read-only. This adds a single
-- round-trip: clinician posts ONE question; caregiver responds in their own
-- language; question/response are both stored alongside language metadata so
-- the UI can show source + translation. Not a chat — capped at one question
-- per share link to keep the product surface small.

CREATE TABLE clinician_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  share_link_id UUID NOT NULL REFERENCES clinician_share_links(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  -- Question authored by the clinician via the portal.
  question_text_source TEXT NOT NULL,
  question_language TEXT NOT NULL,
  question_text_translated TEXT,
  question_translated_to TEXT,
  -- Response from the caregiver (or admin); nullable until answered.
  caregiver_response_text TEXT,
  caregiver_response_language TEXT,
  responded_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  -- One question per share link (the explicit single-shot constraint).
  UNIQUE (share_link_id)
);

ALTER TABLE clinician_questions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_clinician_questions_org_created
  ON clinician_questions (organization_id, created_at DESC);
CREATE INDEX idx_clinician_questions_resident
  ON clinician_questions (resident_id, created_at DESC);
CREATE INDEX idx_clinician_questions_unanswered
  ON clinician_questions (organization_id, created_at DESC)
  WHERE responded_at IS NULL;

-- Org members can read questions for their org. Sensitive notes restrictions
-- do not propagate here because the question is a clinician's own text, not
-- PHI excerpted from notes — but admins can audit via audit_events as usual.
CREATE POLICY "Users can view org clinician questions"
  ON clinician_questions FOR SELECT
  USING (organization_id = get_user_org_id());

-- Caregivers and admins can answer. The portal-side INSERT (clinician posting
-- a question) bypasses RLS via the service-role client because the clinician
-- is unauthenticated — same pattern as clinician_share_links portal access.
CREATE POLICY "Org members can update questions to answer"
  ON clinician_questions FOR UPDATE
  USING (organization_id = get_user_org_id());
