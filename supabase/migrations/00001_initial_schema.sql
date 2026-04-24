-- Kinroster Initial Schema
-- All tables with RLS enabled from the start

-- ============================================
-- Organizations
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rcfe', 'home_care', 'other')),
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  email_from_name TEXT,
  email_reply_to TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'caregiver' CHECK (role IN ('admin', 'caregiver')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_users_org ON users (organization_id);

-- ============================================
-- Residents
-- ============================================
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  move_in_date DATE,
  room_number TEXT,
  conditions TEXT,
  preferences TEXT,
  care_notes_context TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'discharged', 'deceased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_residents_org ON residents (organization_id);
CREATE INDEX idx_residents_org_status ON residents (organization_id, status);

-- ============================================
-- Family Contacts
-- ============================================
CREATE TABLE family_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  receives_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE family_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_family_contacts_resident ON family_contacts (resident_id);

-- ============================================
-- Notes
-- ============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  note_type TEXT NOT NULL CHECK (note_type IN ('shift_note', 'incident', 'observation', 'summary')),
  raw_input TEXT NOT NULL,
  structured_output TEXT,
  is_structured BOOLEAN NOT NULL DEFAULT false,
  structuring_error TEXT,
  last_structuring_attempt_at TIMESTAMPTZ,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_output TEXT,
  shift TEXT CHECK (shift IN ('morning', 'afternoon', 'night')),
  flagged_as_incident BOOLEAN NOT NULL DEFAULT false,
  manually_flagged BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notes_resident_created ON notes (resident_id, created_at DESC);
CREATE INDEX idx_notes_org_created ON notes (organization_id, created_at DESC);
CREATE INDEX idx_notes_author ON notes (author_id, created_at DESC);
CREATE INDEX idx_notes_org_type ON notes (organization_id, note_type);
CREATE INDEX idx_notes_pending_structuring ON notes (is_structured, last_structuring_attempt_at)
  WHERE is_structured = false;
CREATE INDEX idx_notes_flagged ON notes (organization_id, created_at DESC)
  WHERE flagged_as_incident = true;

-- ============================================
-- Incident Reports
-- ============================================
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  report_text TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'closed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  manager_notes TEXT,
  family_notified BOOLEAN NOT NULL DEFAULT false,
  family_notified_at TIMESTAMPTZ,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_incidents_org_status ON incident_reports (organization_id, status);
CREATE INDEX idx_incidents_resident ON incident_reports (resident_id, created_at DESC);
CREATE INDEX idx_incidents_open ON incident_reports (organization_id, created_at DESC)
  WHERE status = 'open';

-- ============================================
-- Family Communications
-- ============================================
CREATE TABLE family_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id),
  recipient_contact_id UUID NOT NULL REFERENCES family_contacts(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  source_note_ids UUID[] DEFAULT '{}',
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE family_communications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_family_comms_resident ON family_communications (resident_id, created_at DESC);
CREATE INDEX idx_family_comms_org ON family_communications (organization_id, created_at DESC);
CREATE INDEX idx_family_comms_status ON family_communications (organization_id, status);

-- ============================================
-- Weekly Summaries
-- ============================================
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT NOT NULL,
  key_trends TEXT[],
  concerns TEXT[],
  incidents_count INTEGER NOT NULL DEFAULT 0,
  source_note_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'regenerating')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resident_id, week_start)
);

ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_weekly_summaries_org ON weekly_summaries (organization_id, week_start DESC);
CREATE INDEX idx_weekly_summaries_resident ON weekly_summaries (resident_id, week_start DESC);
CREATE INDEX idx_weekly_summaries_status ON weekly_summaries (organization_id, status);

-- ============================================
-- RLS Policies
-- ============================================

-- Helper: get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations
CREATE POLICY "Users can view own org"
  ON organizations FOR SELECT
  USING (id = get_user_org_id());

CREATE POLICY "Admins can update own org"
  ON organizations FOR UPDATE
  USING (id = get_user_org_id() AND is_admin());

-- Users
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can insert users (invite)"
  ON users FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND is_admin());

CREATE POLICY "Admins can update any user in org"
  ON users FOR UPDATE
  USING (organization_id = get_user_org_id() AND is_admin());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (organization_id = get_user_org_id() AND is_admin());

-- Residents
CREATE POLICY "Users can view org residents"
  ON residents FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can insert residents"
  ON residents FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND is_admin());

CREATE POLICY "Admins can update residents"
  ON residents FOR UPDATE
  USING (organization_id = get_user_org_id() AND is_admin());

CREATE POLICY "Admins can delete residents"
  ON residents FOR DELETE
  USING (organization_id = get_user_org_id() AND is_admin());

-- Family Contacts (access via resident's org)
CREATE POLICY "Users can view org family contacts"
  ON family_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = family_contacts.resident_id
      AND residents.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can insert family contacts"
  ON family_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = family_contacts.resident_id
      AND residents.organization_id = get_user_org_id()
    )
    AND is_admin()
  );

CREATE POLICY "Admins can update family contacts"
  ON family_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = family_contacts.resident_id
      AND residents.organization_id = get_user_org_id()
    )
    AND is_admin()
  );

CREATE POLICY "Admins can delete family contacts"
  ON family_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = family_contacts.resident_id
      AND residents.organization_id = get_user_org_id()
    )
    AND is_admin()
  );

-- Notes
CREATE POLICY "Users can view org notes"
  ON notes FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Authenticated users can insert notes"
  ON notes FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id()
    AND author_id = auth.uid()
  );

CREATE POLICY "Authors can update own notes within 1 hour"
  ON notes FOR UPDATE
  USING (
    author_id = auth.uid()
    AND created_at > now() - interval '1 hour'
  );

CREATE POLICY "Admins can update any note in org"
  ON notes FOR UPDATE
  USING (organization_id = get_user_org_id() AND is_admin());

-- Incident Reports
CREATE POLICY "Users can view org incidents"
  ON incident_reports FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Authenticated users can insert incidents"
  ON incident_reports FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Admins can update incidents"
  ON incident_reports FOR UPDATE
  USING (organization_id = get_user_org_id() AND is_admin());

-- Family Communications
CREATE POLICY "Admins can view org comms"
  ON family_communications FOR SELECT
  USING (organization_id = get_user_org_id() AND is_admin());

CREATE POLICY "Admins can insert comms"
  ON family_communications FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND is_admin());

CREATE POLICY "Admins can update comms"
  ON family_communications FOR UPDATE
  USING (organization_id = get_user_org_id() AND is_admin());

-- Weekly Summaries
CREATE POLICY "Users can view org summaries"
  ON weekly_summaries FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can update summaries"
  ON weekly_summaries FOR UPDATE
  USING (organization_id = get_user_org_id() AND is_admin());

-- ============================================
-- Signup trigger: create org + user on auth signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization from user metadata
  INSERT INTO organizations (name, type, timezone, trial_ends_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'facility_name', 'My Facility'),
    COALESCE(NEW.raw_user_meta_data->>'facility_type', 'rcfe'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Los_Angeles'),
    now() + interval '14 days'
  )
  RETURNING id INTO new_org_id;

  -- Create user record
  INSERT INTO users (id, organization_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON residents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON weekly_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
