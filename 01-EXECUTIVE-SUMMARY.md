# CareNote — Executive Summary

## One-Sentence Positioning

CareNote turns messy caregiver notes into compliant shift logs and warm family updates in seconds, so small care homes can spend time on residents instead of paperwork.

## The Problem

Small elder-care providers (6–20 bed residential care homes, small home-care agencies) are drowning in documentation. Caregivers spend 45–90 minutes per shift on paperwork. Existing tools are either too enterprise-heavy, too generic, or not focused on written communication workflows.

The consequences:

- **Incomplete documentation** leads to failed state surveys and citations
- **Families feel uninformed** — they only hear from the facility when something goes wrong
- **Incident reports are inconsistent** — creating liability exposure
- **Owner-operators burn out** rewriting and editing everyone else's notes

## The Solution

CareNote is a mobile-first web app that uses Claude (Anthropic's AI) to transform quick caregiver observations into structured, professional documentation. A caregiver types or speaks a raw note; CareNote produces:

1. A **structured shift log** with proper categorization and timestamps
2. An **escalation flag** if the note mentions falls, pain, medication refusal, or behavioral changes
3. A **family-friendly update** ready for the manager to review and send via email
4. A **weekly care summary** compiled from all notes for compliance and family communication

## Why Now

- Claude's instruction-following quality is sufficient to produce documents that pass regulatory review
- Small care homes are the fastest-growing segment of elder care, underserved by enterprise EHR vendors
- Post-COVID regulatory scrutiny on care documentation is increasing, even for small providers
- AI costs have dropped to ~$0.005 per note — making the unit economics work at $149/month

## Business Model

| Item | Detail |
|------|--------|
| Pricing | $149/month per facility, flat rate (no per-seat) |
| Target | Residential care homes (4–20 beds), small home-care agencies |
| TAM | ~30,000 residential care homes in the US + ~400,000 home-care agencies |
| Revenue target | 1,000 facilities = $1.79M ARR |
| Gross margin | ~98% (API costs ~$3/month per facility) |

## Strategic Rationale: Why Build the Documentation MVP First

CareNote's long-term vision extends beyond documentation into data-driven elder housing development (see [Business Roadmap](./04-BUSINESS-ROADMAP.md)). The MVP is the documentation tool because:

1. **Data collection requires usage.** The analytics and insights that inform housing development depend on structured care data from real facilities. You can't skip to Phase 2 without Phase 1.
2. **Revenue from day one.** Documentation SaaS generates immediate, recurring revenue while the data platform is being built.
3. **Trust must be earned.** Care home operators will share data with a tool they use daily and trust. They won't hand data to an analytics platform they've never used.
4. **Regulatory foundation.** HIPAA compliance, de-identification pipelines, and data governance are easier to implement when you control the data ingestion layer.

The data model is designed from day one to support future analytics, but no analytics features are built until 50+ facilities are active on the platform.

## 30-Day MVP Scope

A solo founder builds and ships the core documentation tool:

- Caregiver note input with Claude-powered structuring
- Resident profiles and timeline
- Incident detection and reporting
- Family update generation and email delivery
- Manager dashboard with flags and oversight
- Multi-user auth (caregiver + admin roles)
- Mobile-responsive web app (PWA-capable)

See [Build Plan](./11-BUILD-PLAN.md) for weekly milestones.

## Success Metrics (First 10 Facilities)

| Metric | Target |
|--------|--------|
| Time to first structured note | < 10 minutes from signup |
| Notes per resident per day | 2+ |
| Claude output accepted without edits | 70%+ |
| Trial-to-paid conversion | 40%+ |
| Week 4 retention | 70%+ |
| NPS from owner-operators | 50+ |
