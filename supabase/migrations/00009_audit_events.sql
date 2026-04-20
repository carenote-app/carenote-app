-- Phase 5: audit events.
-- A central append-only log of security-relevant actions. Complements
-- disclosure_events (patient-centric "who received PHI about me") with
-- actor-centric "who did what in the system". Admins (compliance_admin
-- in Phase 6) can read and filter for compliance review.
--
-- Scope for this phase:
--   - Table, RLS, and indexes (this migration).
--   - Triggers on the notes table only — other PHI tables get
--     API-layer logging instead of triggers until Phase 5.5 if needed.
--   - SELECT-audit is NOT in scope; would be a noisy firehose for small
--     home deployments. Add later if a compliance reviewer asks.

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  object_type TEXT,
  object_id UUID,
  result TEXT NOT NULL DEFAULT 'success'
    CHECK (result IN ('success', 'denied', 'error')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_events_org_created
  ON audit_events (organization_id, created_at DESC);
CREATE INDEX idx_audit_events_org_type_created
  ON audit_events (organization_id, event_type, created_at DESC);
CREATE INDEX idx_audit_events_org_user_created
  ON audit_events (organization_id, user_id, created_at DESC);
CREATE INDEX idx_audit_events_object
  ON audit_events (object_type, object_id);

-- Admins read their org's events. INSERT is restricted to service-role
-- (no policy → blocked by RLS); UPDATE / DELETE blocked by no-policy
-- fallback, making the table effectively append-only.
CREATE POLICY "Admins can view org audit events"
  ON audit_events FOR SELECT
  USING (organization_id = get_user_org_id() AND is_admin());

-- ============================================
-- Notes trigger: log create / update / delete
-- ============================================
CREATE OR REPLACE FUNCTION log_notes_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user UUID;
BEGIN
  v_user := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_events
      (organization_id, user_id, event_type, object_type, object_id, result, metadata)
    VALUES
      (NEW.organization_id, v_user, 'note_create', 'note', NEW.id, 'success',
       jsonb_build_object(
         'note_type', NEW.note_type,
         'resident_id', NEW.resident_id
       ));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_events
      (organization_id, user_id, event_type, object_type, object_id, result, metadata)
    VALUES
      (NEW.organization_id, v_user, 'note_update', 'note', NEW.id, 'success',
       jsonb_build_object(
         'is_structured', NEW.is_structured,
         'sensitive_flag', NEW.sensitive_flag,
         'is_edited', NEW.is_edited
       ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_events
      (organization_id, user_id, event_type, object_type, object_id, result, metadata)
    VALUES
      (OLD.organization_id, v_user, 'note_delete', 'note', OLD.id, 'success',
       jsonb_build_object('resident_id', OLD.resident_id));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_notes_changes
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW EXECUTE FUNCTION log_notes_audit();

-- ============================================
-- notes_sensitive_access trigger: grant / revoke
-- ============================================
-- Grants and revokes are rare but compliance-critical. Log from the
-- database so we don't depend on callers remembering to log.
CREATE OR REPLACE FUNCTION log_sensitive_access_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org UUID;
  v_actor UUID;
BEGIN
  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    SELECT organization_id INTO v_org FROM public.residents WHERE id = NEW.resident_id;
    INSERT INTO public.audit_events
      (organization_id, user_id, event_type, object_type, object_id, result, metadata)
    VALUES
      (v_org, v_actor, 'sensitive_access_grant', 'notes_sensitive_access', NEW.id, 'success',
       jsonb_build_object(
         'grantee_user_id', NEW.user_id,
         'resident_id', NEW.resident_id,
         'expires_at', NEW.expires_at,
         'reason', NEW.reason
       ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT organization_id INTO v_org FROM public.residents WHERE id = OLD.resident_id;
    INSERT INTO public.audit_events
      (organization_id, user_id, event_type, object_type, object_id, result, metadata)
    VALUES
      (v_org, v_actor, 'sensitive_access_revoke', 'notes_sensitive_access', OLD.id, 'success',
       jsonb_build_object(
         'grantee_user_id', OLD.user_id,
         'resident_id', OLD.resident_id
       ));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_sensitive_access_changes
  AFTER INSERT OR DELETE ON notes_sensitive_access
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_access_audit();
