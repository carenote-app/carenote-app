-- Phase 6: role expansion.
-- Adds three new roles alongside the existing admin + caregiver:
--   nurse_reviewer  — clinical read access + share authority, no org admin
--   ops_staff       — scheduling + demographics only, no clinical content
--   billing_staff   — demographics + billing, no clinical content
--   compliance_admin — reserved name; functionally equivalent to admin today,
--                     future-proofed for a formal compliance-only tier
--
-- Design calls that deviate from the original plan:
--   1. We do NOT rename admin → compliance_admin. Keeping admin as the
--      catch-all top tier avoids cascading updates through every callsite,
--      RLS policy, and the signup trigger. compliance_admin is reserved as
--      a role value but carries no distinct behavior today.
--   2. caregiver_assignments is created but NOT yet enforced in RLS.
--      A 6-20 bed home usually has caregivers rotating across all residents;
--      enforcing per-assignment visibility is disruptive to ship in one
--      phase. The table exists so admins can start populating assignments;
--      a future sub-phase adds the opt-in RLS gate behind a settings flag.
--   3. Only clinical tables (notes, voice_sessions, incident_reports,
--      weekly_summaries) are tightened to block ops_staff / billing_staff.
--      Residents and family_contacts remain readable because those tables
--      carry operational data (room numbers, contact info) billing and ops
--      legitimately need. Column-level redaction for the clinical fields
--      on residents (conditions, care_notes_context) is future work.

-- ============================================
-- Relax users.role CHECK to admit the new roles
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'admin',
    'caregiver',
    'nurse_reviewer',
    'ops_staff',
    'billing_staff',
    'compliance_admin'
  ));

-- ============================================
-- has_role(p_role) helper
-- ============================================
-- Returns true iff the calling user carries exactly that role. DOES NOT
-- imply admin — callsites that want "admin OR this role" must compose:
-- is_admin() OR has_role('nurse_reviewer').
CREATE OR REPLACE FUNCTION has_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role = p_role FROM users WHERE id = auth.uid()
$$;

-- ============================================
-- Caregiver assignments (not yet RLS-enforced)
-- ============================================
CREATE TABLE caregiver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caregiver_id, resident_id)
);

ALTER TABLE caregiver_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_caregiver_assignments_caregiver
  ON caregiver_assignments (caregiver_id);
CREATE INDEX idx_caregiver_assignments_resident
  ON caregiver_assignments (resident_id);
CREATE INDEX idx_caregiver_assignments_active
  ON caregiver_assignments (caregiver_id, resident_id)
  WHERE end_date IS NULL OR end_date >= CURRENT_DATE;

-- Everyone in the org can see assignments (admins need the list; caregivers
-- want to know what they're assigned to). Admin-only writes.
CREATE POLICY "Users can view org assignments"
  ON caregiver_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = caregiver_assignments.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can insert assignments"
  ON caregiver_assignments FOR INSERT
  WITH CHECK (
    is_admin()
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = caregiver_assignments.resident_id
      AND residents.organization_id = get_user_org_id()
    )
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = caregiver_assignments.caregiver_id
      AND u.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can update assignments"
  ON caregiver_assignments FOR UPDATE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = caregiver_assignments.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can delete assignments"
  ON caregiver_assignments FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = caregiver_assignments.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

-- ============================================
-- Clinical-content RLS tightening
-- ============================================
-- Block ops_staff and billing_staff from reading clinical content on the
-- four tables that carry it. Existing policies on notes include the Phase
-- 4 sensitive gate — preserve that logic, just add the role filter.

DROP POLICY IF EXISTS "Users can view org notes" ON notes;
CREATE POLICY "Users can view org notes"
  ON notes FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND NOT has_role('ops_staff')
    AND NOT has_role('billing_staff')
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

DROP POLICY IF EXISTS "Users can view org incidents" ON incident_reports;
CREATE POLICY "Users can view org incidents"
  ON incident_reports FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND NOT has_role('ops_staff')
    AND NOT has_role('billing_staff')
  );

DROP POLICY IF EXISTS "Users can view org summaries" ON weekly_summaries;
CREATE POLICY "Users can view org summaries"
  ON weekly_summaries FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND NOT has_role('ops_staff')
    AND NOT has_role('billing_staff')
  );

DROP POLICY IF EXISTS "Users can view org voice sessions" ON voice_sessions;
CREATE POLICY "Users can view org voice sessions"
  ON voice_sessions FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND NOT has_role('ops_staff')
    AND NOT has_role('billing_staff')
  );
