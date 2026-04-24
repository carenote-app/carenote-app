# Kinroster — Product Requirements Document (PRD)

## Overview

Kinroster is a mobile-first documentation tool for small elder-care providers. It uses Claude to transform raw caregiver observations into structured shift logs, incident reports, family updates, and care summaries.

This document defines the MVP feature set, user roles, and functional requirements for the 30-day build.

---

## User Roles

### Role 1: Admin (Owner / Manager)

The facility owner or designated manager. Has full access to all features.

| Permission | Access |
|------------|--------|
| View all residents | Yes |
| View all notes (all caregivers) | Yes |
| Create / edit / archive residents | Yes |
| Enter notes | Yes |
| Review and approve incident reports | Yes |
| Generate and send family updates | Yes |
| Generate and review weekly summaries | Yes |
| Invite / remove caregivers | Yes |
| Manage family contacts | Yes |
| View dashboard and flags | Yes |
| Manage billing | Yes |

### Role 2: Caregiver

A staff caregiver who enters notes during their shift. Limited access.

| Permission | Access |
|------------|--------|
| View assigned / all residents | Yes (read-only on profiles) |
| Enter notes | Yes |
| View own notes | Yes |
| View other caregivers' notes | Yes (read-only) |
| Edit own notes (within 1 hour) | Yes |
| Flag a note as incident | Yes |
| Send family updates | No — admin only |
| Manage residents or contacts | No |
| View dashboard | Limited (own shift summary) |

### Role 3: Family Member (V1: No Login)

Family members receive email updates but do not log into Kinroster in V1. They are passive recipients.

---

## Feature Specifications

### F1: Resident Management

**Description:** Admin creates and manages resident profiles. Each resident has basic demographic info, care context, and family contacts.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F1.1 | Admin can create a resident with: first name, last name, date of birth, move-in date, room/bed number | P0 |
| F1.2 | Admin can add free-text fields: conditions, preferences, care context notes | P0 |
| F1.3 | The `care_notes_context` field is sent to Claude with every note generation to provide resident-specific context | P0 |
| F1.4 | Admin can add 1+ family contacts per resident: name, relationship, email, phone, primary flag | P0 |
| F1.5 | Admin can set resident status: active, discharged, deceased | P0 |
| F1.6 | Resident list shows all active residents with last note timestamp and flag indicators | P0 |
| F1.7 | Admin can edit all resident fields; caregivers cannot edit resident profiles | P0 |
| F1.8 | Discharged/deceased residents are hidden from default views but accessible via filter | P1 |

### F2: Note Input and Claude Structuring

**Description:** Caregivers enter raw observations. Claude structures them into professional shift notes with categorization, timestamps, and flags.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F2.1 | Caregiver selects a resident from a dropdown or recent list | P0 |
| F2.2 | Caregiver selects note type: Shift Note, Incident, Observation | P0 |
| F2.3 | Caregiver enters free-text raw input (large text area, mobile-optimized) | P0 |
| F2.4 | On submit, raw input is sent to Claude API with resident context and system prompt | P0 |
| F2.5 | Claude returns structured note with categorized sections (Mood, Nutrition, Mobility, etc.) | P0 |
| F2.6 | Structured note is displayed side-by-side with raw input for review | P0 |
| F2.7 | Caregiver can edit the structured output before saving | P0 |
| F2.8 | Both raw input and final structured output are saved to the database | P0 |
| F2.9 | If caregiver edits the structured output, `is_edited` flag is set to true and `edited_output` stores the final version | P0 |
| F2.10 | Note is timestamped with creation time and attributed to the caregiver | P0 |
| F2.11 | Loading state shown during Claude processing (target < 3 seconds) | P0 |
| F2.12 | Graceful error handling: if Claude API fails, save raw note without structuring and queue for retry | P1 |
| F2.13 | Character limit on raw input: 2,000 characters (prevents abuse, keeps API costs predictable) | P1 |
| F2.14 | Caregiver can tap and hold a microphone button to record a voice observation. On release, audio is sent to Whisper API, transcribed, and populated into the raw input text area for review and editing before saving. Audio is not stored — only the resulting transcript is saved as raw_input. | P0 |

### F3: Incident Detection and Reporting

**Description:** Claude detects potential incidents (falls, medication issues, behavioral events) and prompts the caregiver to create a formal incident report.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F3.1 | When structuring a note, Claude classifies it as ROUTINE, POSSIBLE_INCIDENT, or DEFINITE_INCIDENT | P0 |
| F3.2 | If POSSIBLE_INCIDENT or DEFINITE_INCIDENT, caregiver sees a prompt: "This note may describe an incident. Would you like to create an incident report?" | P0 |
| F3.3 | If caregiver confirms, Claude generates a structured incident report from the raw input | P0 |
| F3.4 | Incident report includes: date/time, location, description, immediate actions, injuries observed, current status, follow-up plan | P0 |
| F3.5 | Incident is saved with severity (low, medium, high) and status (open, reviewed, closed) | P0 |
| F3.6 | Admin is notified of all new incidents (in-app notification on dashboard) | P0 |
| F3.7 | Admin can review incident, add comments, mark as reviewed/closed, note if family was notified | P0 |
| F3.8 | Incident list view for admin: filterable by status, severity, resident, date | P0 |
| F3.9 | Caregiver can also manually flag any note as an incident (override the AI classification) | P1 |

### F4: Shift Log Timeline

**Description:** Chronological feed of all notes for a facility, filterable by resident, caregiver, date, and note type.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F4.1 | Per-resident timeline showing all notes in reverse chronological order | P0 |
| F4.2 | Facility-wide timeline showing all notes across all residents | P0 |
| F4.3 | Filter by: resident, caregiver, note type, date range | P0 |
| F4.4 | Each note card shows: resident name, caregiver name, timestamp, note type, first 2 lines of structured output, flag indicator | P0 |
| F4.5 | Tapping a note card expands to show full structured output and raw input | P0 |
| F4.6 | Incident-flagged notes show a visual indicator (icon or badge) | P0 |
| F4.7 | "Today" view as default landing page for caregivers | P1 |

### F5: Family Update Generation and Delivery

**Description:** Admin selects a resident and date range. Claude generates a warm, family-friendly email from recent notes. Admin reviews, edits, and sends via email.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F5.1 | Admin navigates to a resident and taps "Generate Family Update" | P0 |
| F5.2 | Admin selects date range (default: since last family update was sent) | P0 |
| F5.3 | All notes within the date range are sent to Claude with the family update system prompt | P0 |
| F5.4 | Claude generates a warm, plain-language email (150–250 words) | P0 |
| F5.5 | Admin sees the draft in an editor with the source notes visible below for reference | P0 |
| F5.6 | Admin can edit the draft freely before sending | P0 |
| F5.7 | Admin selects which family contact(s) to send to | P0 |
| F5.8 | Email is sent via Resend from the facility's configured from-name and reply-to address | P0 |
| F5.9 | Sent update is saved to the resident's communication log with: content, recipient, timestamp, source note IDs | P0 |
| F5.10 | "Last update sent" indicator shown on resident profile | P0 |
| F5.11 | Email template is clean, mobile-friendly, with facility name in header | P1 |

### F6: Weekly Care Summary

**Description:** Auto-generated weekly summary per resident from that week's notes. Admin reviews and approves.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F6.1 | Cron job triggers every Sunday at 6 PM (facility timezone) | P1 |
| F6.2 | For each active resident, all notes from the past 7 days are sent to Claude | P1 |
| F6.3 | Claude generates a 1-page summary: overall status, nutrition trends, activity, mood, incidents, follow-ups | P1 |
| F6.4 | Summaries appear on admin dashboard as "Pending Review" | P1 |
| F6.5 | Admin can edit, approve, or regenerate each summary | P1 |
| F6.6 | Approved summaries are saved to the resident's record | P1 |
| F6.7 | Summaries can be printed or exported as PDF (for survey binders) | P1 |

### F7: Manager Dashboard

**Description:** Overview for the admin showing facility status, flags, and action items.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F7.1 | Dashboard shows: notes entered today, residents without notes today, open incidents, pending summaries | P1 |
| F7.2 | Flagged items section: notes Claude flagged for attention | P0 |
| F7.3 | Quick access to each resident's timeline | P0 |
| F7.4 | Family update tracker: which residents haven't received an update in 7+ days | P1 |

### F8: Authentication and User Management

**Description:** Email-based auth with role management. Admin invites caregivers.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F8.1 | Sign up with email and password (admin creates the organization) | P0 |
| F8.2 | Magic link login option (Supabase Auth) | P0 |
| F8.3 | Admin invites caregivers by email; caregiver receives invite link | P0 |
| F8.4 | Invited caregiver creates account and is automatically assigned to the organization with caregiver role | P0 |
| F8.5 | Admin can deactivate a caregiver account (notes are preserved) | P0 |
| F8.6 | Session persistence: stay logged in on mobile browser for 30 days | P0 |

### F9: Onboarding

**Description:** First-time setup flow for new organizations.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F9.1 | After signup, admin enters facility name and timezone | P0 |
| F9.2 | Guided prompt to add first resident | P0 |
| F9.3 | Guided prompt to enter first note (with example raw input) | P0 |
| F9.4 | Empty states throughout the app with helpful guidance text | P1 |

### F10: Billing

**Description:** Stripe-powered subscription management.

**Requirements:**

| ID | Requirement | Priority |
|----|------------|----------|
| F10.1 | 14-day free trial, no credit card required | P0 |
| F10.2 | Trial includes full access, up to 20 residents | P0 |
| F10.3 | After trial: $149/month subscription via Stripe Checkout | P0 |
| F10.4 | Billing portal for updating payment method and viewing invoices | P0 |
| F10.5 | Grace period: 7 days past due before access is restricted | P1 |
| F10.6 | When restricted: read-only access (can view notes but not create new ones) | P1 |

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time (mobile 4G) | < 2 seconds |
| Claude API response time | < 3 seconds for note structuring |
| Uptime | 99.5% (acceptable for MVP) |
| Data encryption in transit | HTTPS everywhere (TLS 1.2+) |
| Data encryption at rest | Supabase default encryption |
| Mobile responsiveness | Fully functional on iPhone SE and Android equivalent |
| Browser support | Safari (iOS), Chrome (Android), Chrome/Firefox (desktop) |
| Concurrent users per facility | Up to 10 simultaneous |
| Note storage | Unlimited (no archival in V1) |
| Whisper API transcription latency | < 2 seconds for a 30-second voice note |

---

## Out of Scope (V1)

See [Executive Summary](./01-EXECUTIVE-SUMMARY.md) for the full non-goals list. Key exclusions:

- Native mobile apps (iOS/Android)
- Medication tracking or MAR sheets
- Scheduling or time tracking
- Family member login portal
- Multi-facility management
- EHR integrations
- Photo/video attachments
- Offline support
- Multi-language AI output
- AI-generated care plans or medical recommendations
