# Kinroster — Technical Architecture

## Architecture Philosophy

Every decision optimizes for three things:
1. **Speed to ship** — a solo founder must go from zero to production in 30 days
2. **Low operational burden** — no infrastructure to manage, no servers to patch
3. **Ability to iterate daily** — deploy changes in minutes, not hours

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                       CLIENT                              │
│                                                           │
│  Next.js 15 App Router                                    │
│  React Server Components + Client Components              │
│  Tailwind CSS + shadcn/ui                                 │
│  PWA manifest (add-to-home-screen)                        │
│  MediaRecorder API (voice input → Whisper)                 │
│                                                           │
└──────────────────────┬────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼────────────────────────────────────┐
│                    SERVER                                  │
│                                                           │
│  Next.js API Routes + Server Actions                      │
│  Middleware: auth check + role enforcement                 │
│                                                           │
│  ┌────────────────┐ ┌────────────┐ ┌───────────────────┐ │
│  │  Note Engine    │ │ Auth       │ │ Email Service     │ │
│  │                │ │            │ │                   │ │
│  │ Validate input │ │ Supabase   │ │ Resend            │ │
│  │ → Claude API   │ │ Auth       │ │ Transactional     │ │
│  │ → Store result │ │ JWT verify │ │ family update     │ │
│  │ → Flag check   │ │ Role check │ │ emails            │ │
│  └────────────────┘ └────────────┘ └───────────────────┘ │
│                                                           │
│  ┌────────────────┐ ┌────────────────────────────────┐   │
│  │ Cron Handler   │ │ Stripe Webhook Handler         │   │
│  │                │ │                                │   │
│  │ Weekly summary │ │ subscription.created           │   │
│  │ generation     │ │ subscription.updated           │   │
│  │ (Vercel Cron)  │ │ invoice.payment_failed         │   │
│  └────────────────┘ └────────────────────────────────┘   │
└──────────┬──────────────────┬─────────────────────────────┘
           │                  │
┌──────────▼──────────┐ ┌─────▼──────────────────────────────┐
│   SUPABASE           │ │   EXTERNAL SERVICES                │
│                      │ │                                    │
│   PostgreSQL         │ │   Claude API (Anthropic)           │
│   Row Level Security │ │   - claude-sonnet-4-6              │
│   Auth (GoTrue)      │ │   - Note structuring               │
│   Edge Functions     │ │   - Family updates                 │
│                      │ │   - Incident reports               │
│   Tables:            │ │   - Weekly summaries               │
│   - organizations    │ │                                    │
│   - users            │ │   Resend                           │
│   - residents        │ │   - Transactional email delivery   │
│   - family_contacts  │ │                                    │
│   - notes            │ │   Stripe                           │
│   - incident_reports │ │   - Subscription billing           │
│   - family_comms     │ │   - Customer portal                │
│                      │ │                                    │
│                      │ │   OpenAI Whisper API               │
│                      │ │   - Voice transcription for        │
│                      │ │     caregiver note input           │
│                      │ │   - Audio sent from browser →      │
│                      │ │     Next.js API route → Whisper →  │
│                      │ │     transcript returned            │
│                      │ │   - Audio is not stored;           │
│                      │ │     transcript only                │
└──────────────────────┘ └────────────────────────────────────┘
```

---

## Tech Stack Decisions

| Layer | Choice | Rationale | Alternatives Considered |
|-------|--------|-----------|------------------------|
| **Framework** | Next.js 15 (App Router) | Full-stack in one framework. RSC for fast loads. API routes eliminate separate backend. | Remix (less ecosystem), SvelteKit (smaller community) |
| **UI** | Tailwind CSS + shadcn/ui | Fast development, accessible components, professional look with minimal effort | Material UI (heavier), Chakra (less flexible) |
| **Database** | Supabase (PostgreSQL) | Auth + DB + RLS in one service. Free tier for dev. Managed PostgreSQL. | PlanetScale (no RLS), Neon (less batteries-included) |
| **Auth** | Supabase Auth | Comes with Supabase. Email/password + magic link. JWT-based. | Clerk (adds cost), NextAuth (more setup) |
| **AI** | Claude API (Sonnet 4.6) | Best instruction-following for structured text. Fast enough for inline UX. Cost-effective. | GPT-4o (comparable but weaker on instruction-following), Gemini (less consistent) |
| **Email** | Resend | Simple API, great DX, free tier sufficient for MVP | SendGrid (more complex), Postmark (more expensive) |
| **Payments** | Stripe | Industry standard, Checkout + Customer Portal = minimal code | Lemon Squeezy (less mature) |
| **Hosting** | Vercel | Zero-config Next.js deploys, edge functions, cron jobs | Railway (more manual), AWS (overkill) |
| **Voice transcription** | OpenAI Whisper API | Best accuracy in noisy environments; handles accented English and multilingual input; ~$0.006/min cost is negligible; HIPAA BAA required before launch | Web Speech API (free but poor noise handling and inconsistent Safari/iOS behavior) |
| **Monitoring** | Sentry | Error tracking, performance monitoring, free tier | LogRocket (more expensive) |

---

## Claude API Integration

### Model Selection

| Task | Model | Rationale |
|------|-------|-----------|
| Note structuring | `claude-sonnet-4-6` | Fast (<2s), high quality for structured output, cost-effective |
| Incident classification | `claude-haiku-4-5-20251001` | Simple classification task, ultra-fast, ultra-cheap |
| Family update generation | `claude-sonnet-4-6` | Requires warmth and nuance; Sonnet handles this well |
| Weekly summary | `claude-sonnet-4-6` | Longer input, needs good synthesis |

### API Call Pattern

Every Claude call follows this structure:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: SYSTEM_PROMPT,        // Task-specific prompt (see 09-PROMPT-ENGINEERING.md)
  messages: [
    {
      role: 'user',
      content: buildUserPrompt({
        residentName: resident.first_name + ' ' + resident.last_name,
        residentContext: resident.care_notes_context,
        conditions: resident.conditions,
        caregiverName: user.full_name,
        noteType: input.note_type,
        timestamp: new Date().toISOString(),
        rawInput: input.raw_text,
      }),
    },
  ],
});
```

### Cost Projections

| Metric | Value |
|--------|-------|
| Average tokens per note (input + output) | ~1,200 |
| Sonnet 4.6 cost per note | ~$0.005 |
| Notes per facility per day | ~30–50 |
| Daily API cost per facility | ~$0.15–0.25 |
| Monthly API cost per facility | ~$4.50–7.50 |
| Family updates per facility per month | ~8–12 |
| Weekly summaries per facility per month | ~48 (12 residents x 4 weeks) |
| Whisper (50% of notes via voice, avg 30 sec per recording) | ~$1–2 |
| **Total monthly API cost per facility** | **~$9–17** |
| **Revenue per facility** | **$149/month** |
| **API cost as % of revenue** | **6–11%** |

### Voice Transcription Flow

1. Caregiver presses and holds microphone button in browser
2. Browser MediaRecorder API captures audio as WebM/Opus blob
3. On release, audio blob is sent via POST to `/api/transcribe`
4. Next.js API route forwards audio to OpenAI Whisper API (model: `whisper-1`)
5. Whisper returns transcript text (typically < 2 seconds for a 30-second note)
6. Transcript is returned to client and populated into the raw input text area
7. Audio blob is discarded — never written to database or storage
8. From this point the flow is identical to text input: caregiver reviews, edits if needed, taps Save Note, Claude structuring begins

**HIPAA note:** Audio sent to Whisper API constitutes PHI transmission. OpenAI BAA must be signed before this feature is used in production with real resident data. Verify BAA availability on OpenAI's current enterprise plan before launch. If BAA is unavailable at launch, fall back to Web Speech API (browser-native, audio never leaves device) as an interim measure.

**Error handling:**
- Whisper API timeout or 5xx: return error to client, display "Transcription failed — please type your note or try again", do not save anything
- Audio too short (< 1 second): validate client-side before sending, show "Hold the button while speaking"
- Rate limiting: standard retry with 1-second backoff, maximum 2 retries

---

### Error Handling

```
1. API call fails (timeout, 5xx):
   → Save raw note without structuring
   → Display: "Note saved. We'll structure it shortly."
   → Queue for retry (simple database flag: structured = false)
   → Background job retries up to 3 times with exponential backoff

2. API returns unexpected format:
   → Log the response for debugging
   → Fall back to displaying raw note
   → Alert admin: "This note couldn't be auto-structured. You can edit it manually."

3. Rate limiting (429):
   → Implement client-side rate limiting (max 1 Claude call per 2 seconds per user)
   → Server-side queue if needed (unlikely at MVP scale)
```

---

## Database Architecture

### Supabase Configuration

- **Project plan:** Free tier for development, Pro ($25/month) for production
- **Region:** US West (closest to initial California market)
- **Connection pooling:** Supavisor (built-in with Supabase)
- **Backups:** Daily automated (Supabase Pro)

### Row Level Security (RLS) Strategy

Every table with user data has RLS enabled. Policies follow this pattern:

```sql
-- All data scoped to organization
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Users can only see residents in their organization
CREATE POLICY "Users can view own org residents"
  ON residents FOR SELECT
  USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Only admins can insert/update residents
CREATE POLICY "Admins can manage residents"
  ON residents FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Key Indexes

```sql
-- Notes are queried by resident + date constantly
CREATE INDEX idx_notes_resident_created ON notes (resident_id, created_at DESC);

-- Dashboard queries filter by org + date
CREATE INDEX idx_notes_org_created ON notes (organization_id, created_at DESC);

-- Incident reports filtered by status
CREATE INDEX idx_incidents_org_status ON incident_reports (organization_id, status);

-- Family contacts looked up by resident
CREATE INDEX idx_family_contacts_resident ON family_contacts (resident_id);
```

---

## Deployment Architecture

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Local | Development | localhost:3000 |
| Preview | PR previews (Vercel auto-deploys) | [branch].kinroster.vercel.app |
| Staging | Pre-production testing | staging.kinroster.app |
| Production | Live app | app.kinroster.app |

### Infrastructure Costs (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Resend | Free → Starter | $0–20 |
| Stripe | Pay-as-you-go | 2.9% + $0.30 per transaction |
| Sentry | Free | $0 |
| Claude API | Pay-as-you-go | $15–50 (scales with usage) |
| Domain | Annual | ~$12/year |
| **Total (10 facilities)** | | **~$80–115/month** |
| **Total (50 facilities)** | | **~$130–200/month** |

### CI/CD Pipeline

```
Developer pushes to GitHub
    │
    ├── Vercel auto-deploys preview for PR branches
    │
    ├── GitHub Actions:
    │   ├── TypeScript type checking
    │   ├── ESLint
    │   └── Vitest unit tests
    │
    └── On merge to main:
        └── Vercel auto-deploys to production
```

---

## Security Considerations

### Data in Transit
- All connections over HTTPS (TLS 1.2+)
- Supabase connections use SSL
- Claude API calls use HTTPS

### Data at Rest
- Supabase encrypts all data at rest (AES-256)
- Backups encrypted

### Authentication
- Supabase Auth handles password hashing (bcrypt)
- JWT tokens with short expiry (1 hour) + refresh tokens (30 days)
- Magic link option for passwordless login

### API Security
- All API routes verify Supabase JWT
- Role-based middleware checks admin vs. caregiver permissions
- Rate limiting on Claude API calls (prevent abuse)
- Input sanitization on all user inputs
- CORS configured for production domain only

### Secrets Management
- Environment variables via Vercel (encrypted at rest)
- Never committed to git
- Separate secrets per environment (staging vs. production)

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Scalability Notes

The MVP architecture comfortably handles the first 100 facilities (1,000+ users, 5,000+ notes/day). Scaling considerations for later:

| Bottleneck | When | Solution |
|------------|------|----------|
| Claude API rate limits | 100+ concurrent note submissions | Request rate limit increase from Anthropic; implement server-side queue |
| Database connections | 500+ concurrent users | Supabase connection pooling handles this; upgrade plan if needed |
| Vercel function cold starts | Noticeable latency on first request | Not a real problem at this scale; upgrade to Pro for faster cold starts |
| Weekly summary generation | 500+ residents generating summaries simultaneously | Stagger generation over a 2-hour window instead of all at once |
| Email sending | 1,000+ family updates/day | Upgrade Resend plan; implement send queue |
