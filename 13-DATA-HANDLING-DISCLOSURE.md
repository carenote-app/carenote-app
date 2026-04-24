# Kinroster — Data Handling Disclosure

**For: Pilot Facility Partners**
**Version:** 1.0
**Last Updated:** April 2026

---

## Purpose of This Document

This document explains how Kinroster collects, stores, processes, and protects data from your facility. We provide this disclosure so you can make an informed decision about using Kinroster and so you can inform your residents (or their legal representatives) about how their information is handled.

Kinroster is committed to transparency. If you have questions about anything in this document, contact us at [INSERT CONTACT EMAIL].

---

## 1. What Data Kinroster Collects

### Resident Information

| Data Collected | Purpose | Example |
|---------------|---------|---------|
| First and last name | Identify the resident in notes and reports | "Dorothy Smith" |
| Date of birth | Age context for care documentation | 03/15/1938 |
| Move-in date | Track length of residency | 01/10/2024 |
| Room or bed number | Identify location within facility | "Room 4B" |
| Medical conditions | Provide context to AI for accurate note structuring | "Dementia, diabetes, limited mobility" |
| Preferences | Personalize care documentation | "Prefers tea over coffee, likes morning walks" |
| Care context notes | Background information sent to AI with each note | "Sundowns in the evening, responds well to music" |
| Resident status | Track active, discharged, or deceased residents | "Active" |

### Family Contact Information

| Data Collected | Purpose |
|---------------|---------|
| Name and relationship | Identify who receives family updates |
| Email address | Deliver family update emails |
| Phone number | Stored for facility reference; Kinroster does not call or text contacts in V1 |

### Caregiver Notes

| Data Collected | Purpose |
|---------------|---------|
| Raw caregiver observation (text typed or spoken) | Source material for AI structuring |
| Voice recording (temporary) | Transcribed to text, then immediately discarded — see Section 3 |
| AI-structured version of the note | Professional documentation for the facility record |
| Caregiver edits to the structured note | Track when and how AI output was modified |
| Note type (shift note, incident, observation) | Categorize documentation |
| Timestamp | Record when the observation was made |
| Caregiver identity | Attribute the note to the staff member who wrote it |

### Incident Reports

| Data Collected | Purpose |
|---------------|---------|
| AI-generated incident report | Formal documentation of safety events |
| Incident type and severity | Classify for tracking and follow-up |
| Manager review notes | Document administrative response |
| Follow-up actions | Track what was done after the incident |

### Family Communications

| Data Collected | Purpose |
|---------------|---------|
| AI-generated family update email | Communication sent to family members |
| Which family member received it | Delivery tracking |
| Date sent | Communication log |

### Facility and Staff Information

| Data Collected | Purpose |
|---------------|---------|
| Facility name, type, timezone | Configure the application |
| Staff email addresses and names | User accounts and note attribution |
| Staff roles (admin or caregiver) | Access control |

---

## 2. What Data Kinroster Does NOT Collect

Kinroster does not collect:

- Social Security numbers
- Insurance or billing information for residents
- Medication administration records (MAR)
- Physician orders or prescriptions
- Financial information about residents or their families
- Photo or video of residents
- Location tracking or GPS data

---

## 3. How AI Is Used

Kinroster uses artificial intelligence to assist with documentation. Here is exactly what the AI does and does not do.

### AI Services Used

| Service | Provider | What It Does |
|---------|----------|-------------|
| **Claude** | Anthropic | Restructures caregiver notes into professional documentation, classifies potential incidents, generates family-friendly email drafts, compiles weekly care summaries |
| **Whisper** | OpenAI | Converts voice recordings into text transcripts (voice-to-text only) |

### What Data Is Sent to the AI

When a caregiver submits a note, the following is sent to Claude:

- Resident's first and last name
- Resident's known conditions and care context
- The raw text of the caregiver's note
- The caregiver's name (for attribution)
- The timestamp

The following is **never** sent to the AI:

- Date of birth
- Family contact information (email, phone)
- Other residents' data
- Financial or billing information

### What the AI Can and Cannot Do

| The AI CAN | The AI CANNOT |
|-----------|--------------|
| Organize raw notes into structured, professional documentation | Make medical diagnoses |
| Flag potential safety concerns (falls, pain, behavior changes) for human review | Recommend medications or treatments |
| Generate warm, plain-language family email drafts | Send any communication without human approval |
| Summarize a week of notes into a care overview | Add information the caregiver did not provide |
| Translate informal language into professional documentation | Make clinical judgments or care plan decisions |

### Human Review Requirement

**Every AI-generated output is reviewed by a human before it becomes part of the record or is sent to anyone.**

- **Shift notes:** The caregiver sees the AI-structured note and must tap "Save" before it is recorded. They can edit it first.
- **Incident reports:** The caregiver reviews the AI-generated report and must confirm before it is saved.
- **Family emails:** The facility admin reviews and edits the AI-drafted email and must tap "Send" with a confirmation step.
- **Weekly summaries:** The facility admin reviews each summary and must tap "Approve" before it is finalized.

There is no automated path where AI-generated content bypasses human review.

### Voice Recording Handling

If a caregiver uses the voice input feature:

1. Audio is recorded on the caregiver's device
2. Audio is transmitted (encrypted via HTTPS) to the transcription service
3. The transcription service returns the text transcript
4. **The audio recording is immediately discarded** — it is not saved to any database, file storage, or backup
5. Only the text transcript is retained as the raw input for note structuring

Audio recordings are never stored, replayed, or retrievable after transcription.

### AI Data Retention by Third Parties

| Provider | Data Retention Policy |
|----------|----------------------|
| Anthropic (Claude) | API inputs and outputs are not retained beyond 30 days. Anthropic does not use API data to train models. |
| OpenAI (Whisper) | API inputs are not used for training. Retention per OpenAI's API data usage policy. |

Neither provider stores your facility's data permanently or uses it to improve their AI models.

---

## 4. How Data Is Stored and Protected

### Where Data Is Stored

All Kinroster data is stored in a managed PostgreSQL database hosted by **Supabase** in the United States (US West region).

### Encryption

| Protection | Method |
|-----------|--------|
| Data in transit | TLS 1.2+ (HTTPS) for all connections — between your device and Kinroster, between Kinroster and AI services, between Kinroster and the database |
| Data at rest | AES-256 encryption on the database and all backups |
| Passwords | Hashed using bcrypt (industry standard); Kinroster staff cannot see your password |
| API keys and secrets | Stored in encrypted environment variables; never in source code |

### Access Controls

| Control | How It Works |
|---------|-------------|
| **Organization isolation** | Your facility's data is completely separated from other facilities at the database level. There is no way for one facility to see another facility's data. |
| **Role-based access** | Admins have full access. Caregivers can enter and view notes but cannot manage residents, send family emails, or access billing. |
| **Session security** | Login sessions expire and require re-authentication. |
| **Staff deactivation** | When a staff member leaves, the admin deactivates their account immediately. Their notes remain in the record but they can no longer log in. |

### Backups

The database is backed up daily. Backups are encrypted and retained per Supabase's data retention policy.

---

## 5. Who Has Access to Your Data

| Who | What They Can Access | Why |
|-----|---------------------|-----|
| **Your facility's admin(s)** | All data for your facility | Facility management and oversight |
| **Your facility's caregivers** | Notes (read/write own, read others'), resident profiles (read-only) | Shift documentation |
| **Kinroster engineering team** | Database access for debugging and support (with your knowledge) | Technical support and system maintenance |
| **Anthropic (Claude)** | Individual notes and resident context during processing | AI-powered note structuring |
| **OpenAI (Whisper)** | Audio recordings during transcription (immediately discarded) | Voice-to-text conversion |
| **Supabase** | Infrastructure-level access to the database | Database hosting and management |

**Kinroster does not sell, share, or provide your data to:**
- Insurance companies
- Pharmaceutical companies
- Marketing companies
- Data brokers
- Government agencies (unless required by law or legal process)
- Any other care facilities

---

## 6. Current Compliance Status

Kinroster is in active development and is transparent about its current compliance posture.

### What Is In Place

- Database-level data isolation between facilities (Row Level Security)
- Encryption in transit (TLS 1.2+) and at rest (AES-256)
- Role-based access control (admin and caregiver roles)
- Human review required for all AI-generated outputs
- AI data minimization (only necessary data sent to AI services)
- Voice recordings never stored
- Stateless AI processing (no data retained by AI providers long-term)

### What Is In Progress

| Item | Target Date | Status |
|------|------------|--------|
| Business Associate Agreement with Anthropic (Claude) | Before pilot launch | Pending signature |
| Business Associate Agreement with Supabase (database) | Before pilot launch | Pending signature |
| Verification of OpenAI BAA for Whisper (voice) | Before pilot launch | Pending verification |
| Full audit logging (who accessed what, when) | Month 3 | Not yet built |
| HIPAA Security Risk Assessment | Month 3 | Not yet started |
| Formal HIPAA compliance program | Month 6 | Not yet started |

### What This Means for You

During the pilot phase, Kinroster is **not formally HIPAA certified** (note: HIPAA does not have a formal "certification" — compliance is self-assessed and verified through audits). We are implementing all standard technical safeguards and pursuing BAAs with our subprocessors.

By participating in the pilot, you acknowledge:
1. You understand Kinroster's current compliance status as described in this document
2. You accept that some compliance components are still in progress
3. You will inform your residents (or their legal representatives) that AI-assisted documentation tools are being used
4. You understand that Kinroster is working toward full HIPAA compliance

---

## 7. Your Rights and Controls

### As a Facility Operator, You Can:

- **View all data** Kinroster stores about your facility, residents, and staff
- **Export your data** upon request (we will provide a complete export within 5 business days)
- **Deactivate staff accounts** immediately when staff leave your facility
- **Stop using Kinroster** at any time — your data will be retained for the legally required period and then deleted upon your request
- **Request data deletion** — we will delete your data after confirming no legal retention requirements apply
- **Ask questions** about how your data is handled at any time

### As a Facility Operator, You Are Responsible For:

- Informing your residents (or their legal representatives) that AI-assisted documentation tools are used at your facility
- Ensuring your staff understand that notes entered into Kinroster are processed by AI
- Managing who has access to Kinroster by inviting and deactivating staff accounts
- Reviewing AI-generated content before it becomes part of the official record or is sent to families
- Complying with your state's documentation and record retention requirements

---

## 8. Changes to This Disclosure

We will notify you of material changes to this data handling disclosure at least 14 days before they take effect. Changes will be sent to the admin email address on your Kinroster account.

---

## 9. Contact

For questions about data handling, privacy, or security:

- **Email:** [INSERT CONTACT EMAIL]
- **Phone:** [INSERT CONTACT PHONE]
- **Mailing address:** [INSERT BUSINESS ADDRESS]
