-- Phase 4: sensitive-data segmentation.
-- Sensitive notes (sensitive_flag=true, set by the structurer when content
-- touches 42 CFR Part 2 or psychotherapy material) are now hidden from the
-- general care-team view. Only the author, admins, and users with an
-- active per-resident grant can read them.
--
-- This migration:
--   1. Creates notes_sensitive_access — per-user-per-resident grant rows
--      admins manage through /sensitive-access.
--   2. Replaces the notes SELECT policy with a tightened version that
--      enforces the new access rules.
--   3. Adds count_hidden_sensitive_notes(resident_id) RPC so the timeline
--      can surface a placeholder ("N sensitive notes hidden") without
--      leaking content.
--
-- Not in scope for this phase:
--   - incident_reports inherits org-wide read from its migration. A
--     sensitive note that triggers an incident still produces an
--     org-readable incident row. Tracked as a known limitation.

-- ============================================
-- Sensitive access grants
-- ============================================
CREATE TABLE notes_sensitive_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  UNIQUE (user_id, resident_id)
);

ALTER TABLE notes_sensitive_access ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sensitive_access_user_resident
  ON notes_sensitive_access (user_id, resident_id);
CREATE INDEX idx_sensitive_access_active
  ON notes_sensitive_access (user_id, resident_id)
  WHERE expires_at IS NULL OR expires_at > now();

-- A user always sees their own grants — the notes SELECT policy's EXISTS
-- subquery depends on this. Admins see all grants within their org so the
-- /sensitive-access admin UI can list and revoke.
CREATE POLICY "Users can view own grants"
  ON notes_sensitive_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view org grants"
  ON notes_sensitive_access FOR SELECT
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notes_sensitive_access.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can insert grants"
  ON notes_sensitive_access FOR INSERT
  WITH CHECK (
    is_admin()
    AND granted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notes_sensitive_access.resident_id
      AND residents.organization_id = get_user_org_id()
    )
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = notes_sensitive_access.user_id
      AND u.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can update grants"
  ON notes_sensitive_access FOR UPDATE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notes_sensitive_access.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can delete grants"
  ON notes_sensitive_access FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notes_sensitive_access.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

-- ============================================
-- Tightened notes SELECT policy
-- ============================================
-- Drop the existing open-to-org policy and replace it with one that
-- respects sensitive_flag. Author still sees own notes; admins see
-- everything; everyone else sees sensitive notes only if they have an
-- active grant for that resident.
DROP POLICY IF EXISTS "Users can view org notes" ON notes;

CREATE POLICY "Users can view org notes"
  ON notes FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND (
      sensitive_flag = false
      OR author_id = auth.uid()
      OR is_admin()
      OR EXISTS (
        SELECT 1 FROM notes_sensitive_access
        WHERE notes_sensitive_access.user_id = auth.uid()
          AND notes_sensitive_access.resident_id = notes.resident_id
          AND (
            notes_sensitive_access.expires_at IS NULL
            OR notes_sensitive_access.expires_at > now()
          )
      )
    )
  );

-- ============================================
-- Disclosure events — sensitive override flag
-- ============================================
-- When an admin explicitly unlocks sensitive content for a clinician share
-- (Phase 4 unlock dialog), the resulting disclosure_events row carries
-- sensitive_override=true so compliance review can surface every override.
ALTER TABLE disclosure_events
  ADD COLUMN sensitive_override BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- count_hidden_sensitive_notes(resident_id)
-- ============================================
-- Returns the number of sensitive notes on this resident that the current
-- user cannot see under the SELECT policy above. Used by the timeline to
-- render a "N sensitive notes hidden" placeholder without leaking content.
--
-- SECURITY DEFINER is needed because the function must look past the user's
-- own RLS on notes (they can't see these rows — that's the whole point) to
-- count them. Org-scoping is enforced inline.
CREATE OR REPLACE FUNCTION count_hidden_sensitive_notes(p_resident_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM notes
  WHERE notes.resident_id = p_resident_id
    AND notes.organization_id = get_user_org_id()
    AND notes.sensitive_flag = true
    AND notes.author_id <> auth.uid()
    AND NOT is_admin()
    AND NOT EXISTS (
      SELECT 1 FROM notes_sensitive_access
      WHERE notes_sensitive_access.user_id = auth.uid()
        AND notes_sensitive_access.resident_id = notes.resident_id
        AND (
          notes_sensitive_access.expires_at IS NULL
          OR notes_sensitive_access.expires_at > now()
        )
    );
$$;
