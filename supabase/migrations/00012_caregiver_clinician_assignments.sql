-- Loosen resident_clinicians INSERT/UPDATE/DELETE from admin-only to any
-- authenticated user in the resident's org. The assignment record is
-- metadata, not a PHI disclosure; the actual disclosure mechanism
-- (clinician_share_links + disclosure_events) remains admin-only and
-- untouched. Adding/editing entries in the clinicians directory itself
-- also stays admin-only (clinicians table policies untouched).

DROP POLICY "Admins can insert resident clinicians" ON resident_clinicians;
DROP POLICY "Admins can update resident clinicians" ON resident_clinicians;
DROP POLICY "Admins can delete resident clinicians" ON resident_clinicians;

CREATE POLICY "Org users can insert resident clinicians"
  ON resident_clinicians FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = resident_clinicians.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Org users can update resident clinicians"
  ON resident_clinicians FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = resident_clinicians.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Org users can delete resident clinicians"
  ON resident_clinicians FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = resident_clinicians.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );
