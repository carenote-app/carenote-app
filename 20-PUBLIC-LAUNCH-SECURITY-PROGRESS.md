# Public Launch Security — Progress Tracker

Plan: Secure CareNote for public signups. Full plan at `/.claude/plans/streamed-mapping-lark.md`.

Last updated: 2026-04-17

---

## Manual Setup Steps

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Cloudflare Turnstile widget created | ✅ Done | Site key: `0x4AAAAAAC_H6v6uU0BeZBvs` |
| 2 | Turnstile site key added to Vercel env vars | ✅ Done | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| 3 | Turnstile secret key added to Supabase | ✅ Done | Attack Protection → Captcha enabled |
| 4 | "Prevent use of leaked passwords" enabled | ✅ Done | Supabase Attack Protection |
| 5 | "Confirm email" enabled in Supabase | ✅ Done | Sign In / Providers → Email |
| 6 | Branch protection on `main` | ✅ Done | Requires 1 PR approval, blocks force push |
| 7 | `develop` branch created | ✅ Done | All new work goes here |
| 8 | Google Cloud Console OAuth credentials | ⏳ Blocked | Quota limit reached, requested increase from Google. Waiting. |
| 9 | Google provider enabled in Supabase | ⏳ Blocked | Depends on #8 |
| 10 | Add Turnstile site key to `.env.local` | ❌ Not done | Do before local testing |

---

## Code Implementation Phases

| Phase | Description | Status | Depends on |
|-------|-------------|--------|------------|
| 1 | DB migration (waitlist, usage_daily, quota functions) | ❌ Not started | Nothing |
| 2 | CAPTCHA + email verification enforcement | ❌ Not started | Phase 1 |
| 3 | Google SSO (callback route + buttons) | ❌ Not started | Manual step #8 + #9 |
| 4 | Rate limiting / quota enforcement on API routes | ❌ Not started | Phase 1 |
| 5 | Trial enforcement UI (banner) | ❌ Not started | Phase 4 |
| 6 | Landing page (waitlist, CTA, marketing opt-in) | ❌ Not started | Phase 1 |

**Note:** Phases 1, 2, 4, 5, 6 can all be built WITHOUT Google OAuth. Only Phase 3 is blocked by the quota. Start with Phases 1-2 and 4-6, add Phase 3 when Google credentials are ready.

---

## When Resuming

Tell Claude: "Let's continue the public launch security plan. Google OAuth is [ready / still blocked]."

Claude will:
1. Read this doc + the plan file at `/.claude/plans/streamed-mapping-lark.md`
2. Check which phases are done
3. Continue from where you left off on the `develop` branch

### What to build first (no blockers):
1. Phase 1: Migration `00004_public_launch_security.sql`
2. Phase 2: Add Turnstile to signup/login, enforce email verification
3. Phase 4: Quota enforcement on voice/AI endpoints
4. Phase 5: Trial banner in dashboard
5. Phase 6: Waitlist form, CTA in demo modal, marketing opt-in

### What's blocked:
- Phase 3 (Google SSO) — waiting on Google Cloud Console quota increase

---

## Files to Clean Up

- `github-branch-ruleset.json` — delete from repo (was used for one-time GitHub import)
- `.env.production` — delete if it still exists (was temporary for Vercel import)

---

## Current Branch State

- On branch: `develop`
- `main` is protected (requires PR + 1 approval)
- Vercel deploys from `main` only
- No code changes made yet for this plan — all work is ahead
