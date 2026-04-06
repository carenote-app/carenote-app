# CareNote — Competitive Intelligence

## Overview

This document captures the competitive landscape as of April 2026, pricing analysis, strategic positioning against key competitors, and documentation for the ROI Calculator sales tool. It supplements the competitive landscape section in [02 — Market Analysis](./02-MARKET-ANALYSIS.md).

---

## Updated Competitive Landscape

The original analysis in 02-MARKET-ANALYSIS.md correctly identified enterprise tools (August Health, StoriiCare) and generic workarounds (paper, Word docs, basic apps) but missed a third category: **small-RCFE-specific operations tools** that occupy the same sales channel and mindshare without being direct feature competitors. These tools target the same buyer persona, attend the same conferences, and partner with the same associations — even though they solve different problems than CareNote.

### Competitor Profiles

#### Synkwise (Highest Priority to Monitor)

| Attribute | Detail |
|-----------|--------|
| **Founded** | 2017, Camas WA |
| **Scale** | 1,500+ facilities nationwide (as of mid-2024) |
| **Pricing** | Starts $29/month (1 home/1 resident); Basic $79/mo; Plus $119/mo; per-resident pricing model |
| **Core focus** | eMAR, pharmacy integration, medication safety, compliance forms |
| **AI status** | No AI features shipped; actively hiring Senior Software Engineer for Healthcare Integrations / AWS / AI — focused on FHIR/HL7 interoperability and medication anomaly detection, NOT shift note structuring |
| **API** | No public API; has a formal partner program |
| **Channel** | RCFE Association formal partner; RAL Conference SoCal; TORCHCON TX |
| **What they don't do** | AI-structured shift notes, incident auto-detection, family update emails, weekly care summaries |

**Strategic note:** 1,500 facilities with unmet demand for exactly what CareNote does; no internal roadmap to solve it; potential distribution partner at month 6+.

#### Alcomy

| Attribute | Detail |
|-----------|--------|
| **Positioning** | Built by operators who ran care homes for decades |
| **Core focus** | Facility management, documentation forms, compliance |
| **Pricing** | Not published, demo-led |
| **AI** | No AI, no public API |

#### Caring Data

| Attribute | Detail |
|-----------|--------|
| **Founder** | Ivonne Meader — active RCFE owner-operator AND RCFE Association Advisory Board member; presented at 2025 RCFE Conference |
| **Core focus** | Documentation management, compliance, caregiver-admin communication |
| **Pricing** | Not published |
| **AI** | No AI features identified |

**Risk:** Operator-founder with direct association access is highest credibility threat in the channel.

#### RCFE-Admin (Senior Wellness Solutions)

| Attribute | Detail |
|-----------|--------|
| **Target** | 6-bed California RCFEs specifically |
| **Positioning** | Claims to cut daily tasks by half |
| **Pricing** | Promotional pricing (free month offered) |
| **AI** | No AI |

#### StoriiCare

| Attribute | Detail |
|-----------|--------|
| **Target** | Adult day programs, assisted living, larger care homes |
| **Pricing** | Starts $650/month — eliminates them from small RCFE ICP |
| **API** | Public API; integrates with HHAeXchange, Microsoft 365, QuickBooks Online |

**Note:** Potential future integration target when CareNote API is built.

#### August Health

| Attribute | Detail |
|-----------|--------|
| **Positioning** | AI-enabled but targeting larger senior living communities |
| **Core focus** | Full EHR, eMAR, billing — not competing in 6–16 bed RCFE segment |

### Competitive Gap Summary

No competitor is doing AI-structured shift notes, AI-generated family updates, or AI weekly care summaries for the small RCFE market. CareNote's entire core value proposition is uncontested. The risk is **channel competition, not feature competition** — Synkwise is already present in the associations and conferences CareNote plans to use for GTM.

---

## Pricing Analysis: Is $149/Month the Right Price?

### Affordability Math

| Metric | Value |
|--------|-------|
| 12-bed facility monthly revenue | 12 × $4,500 = $54,000 |
| CareNote as % of revenue | 0.3% |
| Owner documentation time saved | 1.5 hrs/day × $30/hr × 30 days = $1,350/month |
| ROI ratio | ~9:1 |
| Payback period | 3.3 days |

### The Real Barriers to Payment

The real barriers are not affordability — they are:

1. **"Will the AI actually work for my residents?"** — The first structured note in 10 minutes is the most important commercial moment.
2. **"Will my caregivers actually use it?"** — Caregiver adoption is the real purchase decision even though the admin holds the credit card.
3. **"Is $149 fair vs. Synkwise at $79–119?"** — Address directly: different jobs, not a replacement purchase.
4. **"What if I don't like it?"** — 14-day trial; pilot facilities get free lifetime access in exchange for feedback.

### Pricing Tier Considerations

| Tier | Strategy |
|------|----------|
| **MVP launch** | Hold $149 flat, no discounting |
| **6-bed pushback** | Offer trial, do not discount |
| **Multi-facility** | 10% discount for 3+ facilities (test at month 6) |
| **Entry tier** | $99/month for up to 10 residents — test at month 3 if trial conversion is below 30% |
| **Premium tier Phase 2** | $249/month with benchmarking analytics |

**Note:** Do not discount to close pilots. The first 5 facilities get free lifetime access in exchange for feedback — that is the incentive. After that, price holds.

---

## Competitive Positioning: CareNote vs. Synkwise

### One-Sentence Answer

"Synkwise manages your medications and compliance forms. CareNote makes your shift notes intelligent and keeps families informed. Most facilities will eventually want both — they do completely different jobs."

### Feature Comparison

| Feature | Synkwise | CareNote |
|---------|----------|----------|
| eMAR / medication tracking | Core feature | Out of scope |
| Pharmacy integration | Yes | Out of scope |
| State compliance forms | Built-in | Out of scope |
| AI shift note structuring | Not offered | Core feature |
| AI incident auto-detection | Not offered | Core feature |
| Family update email generation | Not offered | Core feature |
| Weekly care summaries | Not offered | Auto-generated |
| Price (12-bed facility) | ~$100–120/month | $149/month flat |
| Public API | No | Planned V2 |

### Objection Handling

| # | Objection | Response |
|---|-----------|----------|
| 1 | "I already pay for Synkwise — why add another tool?" | Synkwise handles meds and compliance forms. CareNote handles note quality and family communication. Synkwise doesn't structure shift notes or draft family updates — that gap currently costs 1–2 hours a day. |
| 2 | "Can't Synkwise just add this feature?" | Their AI investment is going into medication safety and pharmacy interoperability. They're not building shift note AI. You'd be waiting a long time for a feature that may never come. |
| 3 | "$149 seems high for something I do manually now." | How long do you spend rewriting caregiver notes every day? If it's more than 30 minutes, CareNote pays for itself in the first week. Let me show you your first structured note right now — takes 90 seconds. |
| 4 | "What if my caregivers don't use it?" | If they can send a text, they can use CareNote. The input is a text box. The AI does the rest. We'll have your first caregiver entering notes in the first 10 minutes of setup. |

### Closing Frame

"You don't have to choose. Many facilities will use Synkwise for medications and CareNote for documentation. Together, you have the full picture — without either tool trying to do something it wasn't built for."

---

## Partnership Opportunity: Synkwise

### Prerequisites Before Approaching

- 25+ active paying facilities
- Week-4 retention >70%
- 3+ written operator case studies
- Zero critical bugs for 30 consecutive days
- Anthropic + Supabase BAAs signed

**Do not approach before month 6.** A premature approach gives them intelligence and no reason to partner — they may accelerate their own AI build instead.

### Outreach

- **Contact:** Director of Business Development, sales@synkwise.com
- **Framing:** CareNote adds an AI documentation and family communication layer that Synkwise operators are currently solving manually. Rather than build it themselves, Synkwise could offer CareNote as a recommended partner tool with a referral arrangement. Their operators get a better documentation experience; CareNote gets distribution; Synkwise retains the eMAR relationship.

---

## ROI Calculator Documentation

### Purpose

An interactive sales tool for use in demo calls, on the marketing website, and embedded in the product onboarding flow. Helps operators calculate their personal return on investment before committing to a paid subscription.

### Intended Use Cases

- **Sales demo call:** Share screen, let prospect adjust their own inputs — people trust math they ran themselves more than math you ran for them.
- **Marketing website:** Embed as standalone page or widget to capture interest pre-signup.
- **Post-trial follow-up:** Send as link after trial to reinforce value before conversion.
- **Onboarding flow:** Show during setup to anchor the $149 price against demonstrated time savings.

### Inputs

| Input | Range | Default | What it captures |
|-------|-------|---------|-----------------|
| Number of residents | 4–20 | 12 | Facility size |
| Monthly rate per resident | $2,000–$8,000 | $4,500 | Revenue context |
| Hours/day on documentation | 0.5–4 hrs | 1.5 hrs | Primary time cost |
| Owner time value ($/hr) | $15–$75 | $30 | Labor cost baseline |
| Citations/complaints past year | 0–5 | 1 | Risk and liability exposure |

### Value Calculation Logic

```
Documentation labor saved (monthly) = hrs_per_day × wage_per_hr × 30
Survey prep saved (monthly, fixed)  = 2 hrs × wage_per_hr
Risk reduction value                = citations_complaints × $100
Family retention value              = 1 call/week × 4 weeks × wage_per_hr
Total monthly value                 = sum of all four
ROI ratio                           = total / 149
Payback period (days)               = (149 / total) × 30
```

### Output Metrics

- **Monthly facility revenue:** residents × rate (anchors price as % of revenue)
- **Monthly documentation cost:** hrs × wage × 30 (primary value driver)
- **ROI ratio:** total / $149 (headline number)
- **Payback period in days:** most persuasive output — reframes monthly cost as days
- **Total monthly value breakdown:** four line items shown transparently
- **Verdict sentence:** dynamic plain-language summary personalised to inputs

### Sales Conversation Tips

- Let the prospect set the inputs on demo calls — people trust their own math.
- Lead with payback days, not ROI ratio — "pays for itself in 3 days" is more visceral than "9x return."
- The documentation hours slider is the most important — walk through what counts: rewriting notes, reviewing incomplete entries, writing incident reports, drafting family updates.
- Use the risk line for survey-triggered prospects — a serious documentation failure can cost $5,000–$50,000 in legal and remediation costs; $100/citation is extremely conservative.

### Implementation Notes

- Entirely client-side JavaScript — no backend required.
- Implement as standalone HTML page, React component in onboarding flow, or iframe embed for landing pages and email follow-ups.
- All displayed numbers must use `Math.round()` — JS float arithmetic produces artifacts (1.5 × 30 × 30 = 1349.999...).
- Core calculation function should be extracted as a shared utility for consistent results across implementations.

---

## Key Intelligence Decisions

| Decision | Rationale | Revisit when |
|----------|-----------|-------------|
| Hold $149/month at launch | Right price for ICP; early discounting anchors wrong expectations | Month 3 — test $99 entry tier if trial conversion <30% |
| Do not approach Synkwise before month 6 | Premature approach gives intelligence without leverage | Month 6 — when 25+ paying facilities and retention data exist |
| Position as complement to Synkwise, not replacement | Most prospects know Synkwise; direct competition is harder than coexistence | Never — this framing is durable |
| Monitor Caring Data (Ivonne Meader) | Operator-founder with RCFE Association Advisory Board seat is highest credibility threat | Quarterly — check for AI feature launches |
| StoriiCare API as future integration target | Public API, family engagement features, complementary market segment | Phase 2 — when CareNote API is built |
