# Kinroster — User Flows

## Overview

This document describes the detailed step-by-step flows for every core user journey in Kinroster. Each flow specifies user actions, system responses, Claude interactions, and edge cases.

---

## Flow 1: Organization Setup and Onboarding

**Actor:** Admin (new user)
**Trigger:** First visit to Kinroster

```
1. Admin visits kinroster.app
2. Taps "Start Free Trial"
3. Enters email address and password
4. Supabase Auth sends verification email
5. Admin clicks verification link → redirected to onboarding

6. ONBOARDING STEP 1: Facility Info
   - Enter facility name (e.g., "Sunrise Care Home")
   - Select facility type: Residential Care Home / Home Care Agency
   - Select timezone
   - Enter email display name (for family update emails)
   - Enter reply-to email address
   → Organization record created

7. ONBOARDING STEP 2: Add First Resident
   - Enter first name, last name
   - Optional: date of birth, room number
   - Optional: conditions, preferences (free text)
   - Add one family contact: name, relationship, email
   → Resident + family contact records created

8. ONBOARDING STEP 3: Enter First Note
   - Pre-selected to the resident just created
   - Example placeholder text shown in input:
     "e.g., Had a good morning. Ate most of breakfast.
      Went for a walk in the garden. Seemed happy today."
   - Admin types a note and taps "Save Note"
   - Claude structures the note
   - Admin sees the structured output
   → First note saved

9. Admin lands on the dashboard
   - "You're all set!" confirmation
   - Quick links: Add more residents, Invite caregivers, Enter notes
```

**Time to complete:** < 10 minutes

---

## Flow 2: Caregiver Enters a Shift Note

**Actor:** Caregiver
**Trigger:** During or at end of shift, caregiver needs to document an observation

```
1. Caregiver opens Kinroster on phone browser (bookmarked / PWA)
   - Already logged in (30-day session persistence)
   - Lands on "Today" view showing residents with today's activity

2. Taps resident name (e.g., "Dorothy M.")
   → Navigates to resident detail page
   → Shows recent notes (last 48 hours)

3. Taps "+ Add Note" button (floating action button, bottom right)

4. NOTE INPUT SCREEN:
   ┌─────────────────────────────────┐
   │ Resident: Dorothy M.            │
   │                                 │
   │ Note Type: [Shift Note ▼]      │
   │   Options: Shift Note /         │
   │            Incident /           │
   │            Observation          │
   │                                 │
   │ ┌─────────────────────────────┐ │
   │ │                             │ │
   │ │ Type your observation...    │ │
   │ │                             │ │
   │ │                             │ │
   │ │                             │ │
   │ └─────────────────────────────┘ │
   │                                 │
   │        [Save Note]              │
   └─────────────────────────────────┘

5. Caregiver types raw note:
   "dorothy was agitated this morning, didnt want breakfast.
    calmed down after we went outside for a walk.
    ate lunch fine. daughter called, told her mom is doing ok"

6. Taps "Save Note"

7. PROCESSING STATE:
   - Button changes to spinner with "Structuring note..."
   - Raw input + resident context + system prompt → Claude API
   - Target: < 3 seconds

8. REVIEW SCREEN:
   ┌─────────────────────────────────┐
   │ ✓ Note Structured               │
   │                                 │
   │ STRUCTURED OUTPUT:              │
   │ ─────────────────               │
   │ Shift Note — Dorothy M.         │
   │ Apr 3, 2026 · 11:45 AM          │
   │ James R. (Day Shift)            │
   │                                 │
   │ Mood & Behavior: Dorothy was    │
   │ agitated this morning and       │
   │ initially refused breakfast.    │
   │ She calmed down after an        │
   │ outdoor walk with staff.        │
   │                                 │
   │ Nutrition: Refused breakfast.   │
   │ Ate lunch without difficulty.   │
   │                                 │
   │ Family Contact: Dorothy's       │
   │ daughter called. Staff informed │
   │ her that Dorothy is doing well. │
   │                                 │
   │ Follow-up: Monitor morning      │
   │ appetite; note if breakfast     │
   │ refusal continues.             │
   │                                 │
   │ ── Raw Input ──────── [expand] │
   │                                 │
   │   [Edit]  [Save]  [Discard]    │
   └─────────────────────────────────┘

9a. If caregiver taps "Save":
    → Note saved (raw + structured)
    → Returns to resident timeline
    → Success toast: "Note saved"

9b. If caregiver taps "Edit":
    → Structured text becomes editable
    → Caregiver modifies text
    → Taps "Save" → saved with is_edited = true

9c. If caregiver taps "Discard":
    → Confirmation dialog: "Discard this note?"
    → If confirmed, note is not saved
    → Returns to resident page
```

**Edge cases:**
- **Claude API timeout:** Save raw note without structuring. Show message: "Note saved. We'll structure it shortly." Queue for background processing.
- **Empty input:** Prevent submission. Show validation: "Please enter an observation."
- **Very long input (>2,000 chars):** Show character counter. Prevent submission over limit.
- **Non-English input:** Claude handles multilingual input natively. Structured output is in English.

---

## Flow 2b: Caregiver Enters a Shift Note via Voice

**Actor:** Caregiver
**Trigger:** During or at end of shift, caregiver prefers to speak rather than type

```
1. Caregiver opens Kinroster on phone, navigates to resident (same as Flow 2
   steps 1–4)

2. On the note input screen, caregiver taps and holds the microphone button
   (located below the text area)

3. A recording indicator appears — caregiver speaks their observation naturally:
   "Dorothy was agitated this morning, didn't want breakfast. Calmed down after
   we went outside for a walk. Ate lunch fine. Around 10am she slipped getting
   out of the wheelchair, I caught her. No injuries, she said she was fine.
   Daughter called around 11."

4. Caregiver releases the button

5. PROCESSING STATE: "Transcribing..." indicator shown (target < 2 seconds)

6. Transcript populates the raw input text area exactly as typed text would

7. Caregiver reviews the transcript, makes any corrections (e.g. names
   mis-transcribed)

8. Caregiver taps "Save Note" — from this point the flow is identical to
   Flow 2 steps 6 onwards (Claude structuring, incident detection, review screen)
```

**Edge cases:**
- **Background noise causes mis-transcription:** Caregiver edits text before saving; the edit is their responsibility and opportunity to correct before Claude sees it.
- **Resident name transcribed incorrectly (e.g. "Dora fee" for "Dorothy"):** Caregiver corrects in the text area before saving.
- **Network failure during transcription:** Show error "Transcription failed — please type your note or try again"; fall back to text input gracefully.
- **Very short audio (< 2 seconds):** Show validation "Recording too short — hold the button while speaking."
- **Non-English speech:** Whisper handles multilingual input natively; transcript may be in the caregiver's language; Claude structures and outputs in English as normal.

**Note:** Audio is never stored. Only the transcript (as raw_input) is saved to the database. This is both a privacy protection and a storage simplification.

---

## Flow 3: Incident Detection and Report

**Actor:** Caregiver → Admin
**Trigger:** Caregiver enters a note that describes a potential incident

```
1. Caregiver enters note for Mr. Ramirez:
   "mr ramirez slipped getting out of bed around 9pm.
    he grabbed the bedrail and didnt fall. checked him over,
    no injuries, he said hes fine. put his non-slip socks on
    and made sure the floor mat was in place."

2. Taps "Save Note"

3. Claude processes the note:
   - Classification: POSSIBLE_INCIDENT (near-fall)
   - Structured shift note generated as usual
   - Incident flag triggered

4. REVIEW SCREEN (with incident prompt):
   ┌─────────────────────────────────┐
   │ ✓ Note Structured               │
   │                                 │
   │ ⚠ POSSIBLE INCIDENT DETECTED   │
   │ This note describes a near-fall.│
   │ Would you like to create a      │
   │ formal incident report?         │
   │                                 │
   │ [Yes, Create Report]  [No]      │
   │                                 │
   │ STRUCTURED OUTPUT:              │
   │ ─────────────────               │
   │ [structured shift note here]    │
   │                                 │
   │   [Edit]  [Save]  [Discard]    │
   └─────────────────────────────────┘

5a. If caregiver taps "No":
    → Note saved normally with flagged_as_incident = false
    → Flag still visible to admin on dashboard

5b. If caregiver taps "Yes, Create Report":
    → Claude generates incident report from raw input
    → Additional fields presented:

   ┌─────────────────────────────────┐
   │ INCIDENT REPORT                 │
   │ ─────────────────               │
   │ Resident: Mr. Ramirez           │
   │ Date/Time: Apr 3, 2026 · 9:00PM│
   │ Type: Near-Fall                 │
   │ Severity: [Low ▼]              │
   │                                 │
   │ Description:                    │
   │ Resident slipped while getting  │
   │ out of bed at approximately     │
   │ 9:00 PM. Resident grasped the   │
   │ bedrail and did not fall to the │
   │ floor.                          │
   │                                 │
   │ Immediate Actions:              │
   │ • Staff assessed resident       │
   │ • No visible injuries observed  │
   │ • Resident reports no pain      │
   │ • Non-slip socks applied        │
   │ • Floor mat repositioned        │
   │                                 │
   │ Current Status:                 │
   │ Resident is alert, oriented,    │
   │ and reports feeling fine.       │
   │                                 │
   │ Follow-up:                      │
   │ • Monitor for 24 hours          │
   │ • Check for delayed symptoms    │
   │                                 │
   │   [Edit]  [Save Report]         │
   └─────────────────────────────────┘

6. Caregiver reviews, optionally edits, taps "Save Report"
   → Incident report saved with status: open
   → Linked to the source shift note
   → Admin receives notification

7. ADMIN RECEIVES NOTIFICATION:
   → Dashboard shows: "1 new incident — Mr. Ramirez (near-fall)"
   → Admin taps to review
   → Can add manager notes, mark family notified, change status to reviewed/closed
```

---

## Flow 4: Family Update Generation

**Actor:** Admin
**Trigger:** Admin wants to send a family member an update about their loved one

```
1. Admin navigates to resident profile (e.g., Dorothy M.)

2. Taps "Generate Family Update"

3. DATE RANGE SELECTOR:
   ┌─────────────────────────────────┐
   │ Family Update for Dorothy M.    │
   │                                 │
   │ Date range:                     │
   │ From: [Mar 28, 2026]           │
   │ To:   [Apr 3, 2026]            │
   │                                 │
   │ Notes found: 14                 │
   │ Last update sent: Mar 27, 2026  │
   │                                 │
   │      [Generate Update]          │
   └─────────────────────────────────┘

4. Admin taps "Generate Update"
   → All 14 notes within the range are sent to Claude
   → Claude generates family-friendly email

5. DRAFT REVIEW SCREEN:
   ┌─────────────────────────────────┐
   │ Family Update Draft             │
   │ ─────────────────               │
   │                                 │
   │ To: Sarah Chen (Daughter)  [▼]  │
   │ Subject: Weekly Update —        │
   │   Dorothy                       │
   │                                 │
   │ ┌─────────────────────────────┐ │
   │ │ Hi Sarah,                   │ │
   │ │                             │ │
   │ │ Here's a quick update on    │ │
   │ │ how your mom has been doing │ │
   │ │ this past week.             │ │
   │ │                             │ │
   │ │ Dorothy has been in good    │ │
   │ │ spirits overall. She's been │ │
   │ │ enjoying her afternoon walks│ │
   │ │ outside, which have become  │ │
   │ │ a highlight of her day...   │ │
   │ │                             │ │
   │ │ [editable text area]        │ │
   │ └─────────────────────────────┘ │
   │                                 │
   │ ── Source Notes ──── [expand]   │
   │ 14 notes from Mar 28 – Apr 3   │
   │                                 │
   │   [Send Email]  [Save Draft]    │
   └─────────────────────────────────┘

6a. Admin edits the draft as needed

6b. Admin taps "Send Email"
    → Confirmation: "Send this update to Sarah Chen
       (sarah@email.com)?"
    → If confirmed:
       - Email sent via Resend
       - From: "Sunrise Care Home" <updates@kinroster.app>
       - Reply-To: maria@sunrisecare.com (facility's configured email)
       - Family communication record saved
       - "Last update sent" timestamp updated on resident profile
       - Toast: "Update sent to Sarah Chen"

6c. Admin taps "Save Draft"
    → Draft saved for later editing/sending
    → Accessible from resident profile
```

---

## Flow 5: Weekly Care Summary

**Actor:** System (automated) → Admin (review)
**Trigger:** Cron job fires every Sunday at 6 PM facility timezone

```
1. SYSTEM (automated, Sunday 6 PM):
   → For each active resident with notes in the past 7 days:
   → Collect all notes from the week
   → Send to Claude with weekly summary system prompt
   → Save generated summary with status: pending_review

2. ADMIN (Monday morning):
   → Opens dashboard
   → Sees: "4 weekly summaries ready for review"
   → Taps to see list of summaries

3. SUMMARY REVIEW:
   ┌─────────────────────────────────┐
   │ Weekly Summary — Dorothy M.     │
   │ Mar 28 – Apr 3, 2026           │
   │ Based on 14 notes               │
   │ ─────────────────               │
   │                                 │
   │ Overall Status:                 │
   │ Dorothy had a generally good    │
   │ week with some morning          │
   │ agitation noted on two days.    │
   │                                 │
   │ Nutrition:                      │
   │ Appetite steady at lunch and    │
   │ dinner. Breakfast refusal       │
   │ noted on Apr 1 and Apr 3.      │
   │                                 │
   │ Activities:                     │
   │ Participated in daily outdoor   │
   │ walks. Attended gardening       │
   │ session Thursday.               │
   │                                 │
   │ Mood:                           │
   │ Mostly positive. Morning        │
   │ agitation resolved with         │
   │ outdoor activity both times.    │
   │                                 │
   │ Incidents: None this week.      │
   │                                 │
   │ Follow-up:                      │
   │ Continue monitoring breakfast   │
   │ patterns. Outdoor walks appear  │
   │ to be beneficial for mood.      │
   │                                 │
   │  [Approve] [Edit] [Regenerate]  │
   └─────────────────────────────────┘

4a. Admin taps "Approve" → Summary saved as approved
4b. Admin taps "Edit" → Can modify text, then approve
4c. Admin taps "Regenerate" → Claude generates a new version
```

---

## Flow 6: Caregiver Invitation

**Actor:** Admin
**Trigger:** Admin wants to add a new caregiver to the facility

```
1. Admin goes to Settings → Team
2. Taps "Invite Caregiver"
3. Enters caregiver's email address
4. System sends invitation email:
   "Maria at Sunrise Care Home has invited you to join Kinroster.
    Click here to create your account."
5. Caregiver clicks link → account creation page
   - Enters full name and password
   - Account created with caregiver role, linked to the organization
6. Caregiver is redirected to the "Today" view
7. Admin sees the new caregiver in the team list
```

---

## Flow 7: Shift Handoff (Passive)

**Actor:** Incoming caregiver
**Trigger:** Caregiver starts their shift and wants to know what happened

```
1. Incoming caregiver opens Kinroster
2. Lands on "Today" view
3. Sees notes from the previous shift for each resident
4. Taps any resident to see their recent timeline
5. Reads the structured notes — no verbal handoff needed

Note: This is a passive flow. There is no explicit "handoff"
feature. The value comes from the structured notes being
available and readable. The shift log IS the handoff.
```

---

## Navigation Structure

### Mobile Layout

```
┌─────────────────────────────────┐
│ ☰  Kinroster        [facility]  │  ← Header
├─────────────────────────────────┤
│                                 │
│                                 │
│         MAIN CONTENT            │
│                                 │
│                                 │
│                            [+]  │  ← FAB: Add Note
├─────────────────────────────────┤
│  Today  │ Residents │ Dashboard │  ← Bottom Nav (3 tabs)
└─────────────────────────────────┘

Tab 1: Today — all notes from today, grouped by resident
Tab 2: Residents — list of all residents, tap to view profile + timeline
Tab 3: Dashboard — admin-only metrics, flags, action items
        (caregivers see a simplified "My Shift" view)

Hamburger menu (☰):
  - Team (admin only)
  - Settings (admin only)
  - Billing (admin only)
  - Log Out
```
