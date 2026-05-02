-- Phase 11: Multilingual + culturally-aware demographics for Taiwan readiness.
-- Additive only — every existing US/HIPAA org keeps its current behavior because
-- the new regulatory_region defaults to 'hipaa_us' and language fields default
-- to 'en'.
--
-- Adds language and cultural-context fields across five tables:
--   organizations    - country, regulatory_region, default_*_language
--   users            - preferred_language, secondary_languages
--   residents        - preferred_language, country_of_origin, religion,
--                      dietary, name fields, honorific, lunar DOB, taboos
--   family_contacts  - preferred_communication_language, country_of_residence
--   clinicians       - clinical_language, secondary_clinical_language
--
-- No RLS policy changes. New columns are visible under the existing org-scoped
-- policies inherited by their parent table.

-- ============================================
-- organizations: regulatory & language defaults
-- ============================================
ALTER TABLE organizations
  ADD COLUMN country TEXT,
  ADD COLUMN regulatory_region TEXT NOT NULL DEFAULT 'hipaa_us'
    CHECK (regulatory_region IN ('hipaa_us', 'pdpa_tw', 'gdpr_eu')),
  ADD COLUMN default_output_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN default_clinical_language TEXT NOT NULL DEFAULT 'en';

CREATE INDEX idx_organizations_regulatory_region
  ON organizations (regulatory_region);

-- ============================================
-- users: caregiver language preferences
-- ============================================
ALTER TABLE users
  ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN secondary_languages TEXT[] NOT NULL DEFAULT '{}';

-- ============================================
-- residents: language + cultural demographics
-- ============================================
-- Vietnamese names are family-middle-given; Indonesian residents may have
-- mononyms. We split family_name/given_name explicitly and keep the existing
-- first_name/last_name columns untouched for backwards compatibility — code
-- that wants culturally-correct addressing should use family_name + given_name
-- + honorific_preference together.
ALTER TABLE residents
  ADD COLUMN preferred_language TEXT,
  ADD COLUMN secondary_languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN country_of_origin TEXT,
  ADD COLUMN years_in_taiwan INTEGER,
  ADD COLUMN religion TEXT,
  ADD COLUMN dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN family_name TEXT,
  ADD COLUMN given_name TEXT,
  ADD COLUMN name_pronunciation TEXT,
  ADD COLUMN honorific_preference TEXT,
  ADD COLUMN lunar_calendar_dob DATE,
  ADD COLUMN cultural_taboos TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_residents_country_of_origin
  ON residents (country_of_origin)
  WHERE country_of_origin IS NOT NULL;

-- ============================================
-- family_contacts: per-contact comm language + residence
-- ============================================
-- A single resident may have one family member in Taipei (Mandarin) and
-- another in Hanoi (Vietnamese) — each gets their own communication language
-- so weekly updates fan out correctly.
ALTER TABLE family_contacts
  ADD COLUMN preferred_communication_language TEXT,
  ADD COLUMN country_of_residence TEXT;

-- ============================================
-- clinicians: clinical-output language
-- ============================================
-- Default to zh-TW because the first deployment is Taiwan; HIPAA-region
-- clinicians who get this added in their org will read default_clinical_language
-- from their organization, but storing per-clinician preference lets us
-- override (e.g., an English-trained specialist in Taipei).
ALTER TABLE clinicians
  ADD COLUMN clinical_language TEXT NOT NULL DEFAULT 'zh-TW',
  ADD COLUMN secondary_clinical_language TEXT NOT NULL DEFAULT 'en';
