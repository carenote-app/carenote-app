# CareNote — Business Roadmap

## Three-Phase Vision

CareNote is not just a documentation tool. The long-term vision is a **data-informed platform that shapes how and where elder care facilities are built.** But the path to that vision runs through a focused MVP.

```
Phase 1 (Month 0–6)          Phase 2 (Month 6–18)         Phase 3 (Month 18+)
────────────────────          ────────────────────         ────────────────────
Documentation SaaS     →     Data Insights Platform  →    Development Advisory
$149/month per facility       $249/month premium tier      Consulting / licensing
Goal: 50 facilities           Goal: 200 facilities         Goal: Revenue diversification
Focus: Product-market fit     Focus: Data moat             Focus: Real estate partnerships
```

## Why This Sequence Matters

| Phase | Depends On | Produces |
|-------|-----------|----------|
| Phase 1 (Documentation) | Nothing — start here | Structured care data, facility relationships, revenue |
| Phase 2 (Insights) | 50+ facilities generating data | De-identified benchmarks, resident archetypes, operational patterns |
| Phase 3 (Advisory) | Statistically significant data set | Housing development recommendations, placement optimization |

Skipping Phase 1 is not viable. The data platform requires structured data from real facilities. The documentation tool is the data collection mechanism.

---

## Phase 1: Documentation MVP (Month 0–6)

### Objective

Build and launch a documentation tool that 50 care home operators use daily and pay for monthly.

### Milestones

| Month | Milestone | Key Metric |
|-------|-----------|------------|
| 1 | MVP shipped, 5 pilot facilities onboarded | First structured note generated |
| 2 | Iterate based on pilot feedback, fix top 3 usability issues | 60%+ daily active caregiver rate |
| 3 | First paying customers (pilot → paid conversion) | 3–5 paying facilities |
| 4 | Organic referrals from pilots, expand to 15 facilities | First unprompted referral |
| 5 | Add voice input (Web Speech API), weekly summary automation | Notes per facility per day > 20 |
| 6 | 50 facilities, product-market fit signal | Trial → paid conversion > 40%, NPS > 50 |

### Revenue Projection (Phase 1)

| Month | Facilities | MRR |
|-------|-----------|-----|
| 1 | 5 (free pilots) | $0 |
| 2 | 8 (3 paying) | $447 |
| 3 | 15 (12 paying) | $1,788 |
| 4 | 25 (20 paying) | $2,980 |
| 5 | 35 (30 paying) | $4,470 |
| 6 | 50 (42 paying) | $6,258 |

### Key Decisions in Phase 1

1. **Single state or multi-state?** Start in California (most RCFEs, best licensing data access). Expand to Washington and Texas in month 4–5.
2. **HIPAA BAA timing:** Pursue Anthropic BAA by month 3. If unavailable, implement PII stripping before Claude API calls by month 4.
3. **Hire or stay solo?** Stay solo through month 6. First hire should be a part-time customer success person (care home background) at month 4–5 if adoption is strong.

---

## Phase 2: Data Insights Platform (Month 6–18)

### Objective

Turn the structured documentation data into de-identified, aggregated insights that help care home operators benchmark their performance and improve resident outcomes.

### Prerequisites

- 50+ active facilities (sufficient data for meaningful aggregation)
- HIPAA-compliant data pipeline (BAA signed, audit logging in place)
- De-identification pipeline (HIPAA Safe Harbor method — strip 18 identifiers)

### Features

| Feature | Description | Revenue Impact |
|---------|-------------|---------------|
| **Facility Benchmarking** | "Your incident rate is 20% below average for facilities your size" | Premium tier differentiator |
| **Resident Archetypes** | Cluster residents by care needs, activity levels, and outcomes | Informs placement and facility design |
| **Trend Detection** | "Dorothy's appetite has declined 30% over 4 weeks" — proactive alerts | Reduces adverse events, strong retention driver |
| **Survey Readiness Score** | "Your documentation completeness is 87% — here are the gaps" | Direct compliance value |
| **Staffing Insights** | "Facilities with your resident mix average 1:5 staff ratio during day shift" | Operational optimization |

### Data That Can Be Safely Aggregated (HIPAA-Compliant)

All of the following use de-identified, aggregated data only:

| Data Category | What's Collected | How It's Used |
|---------------|-----------------|---------------|
| Care intensity patterns | Average notes per resident per day by condition type | Staffing model recommendations |
| Incident frequencies | Falls, medication issues, behavioral events per 100 resident-days | Benchmarking, risk identification |
| Nutrition trends | Appetite change patterns across populations | Facility meal program design |
| Activity participation | Types and frequency of activities correlated with outcomes | Activity programming guidance |
| Documentation completeness | Percentage of shifts with complete notes | Compliance readiness scoring |

### What You Cannot Do With This Data

| Prohibited Use | Why |
|---------------|-----|
| Identify individual residents across facilities | HIPAA violation |
| Share identifiable data with real estate developers | HIPAA violation |
| Sell resident data to insurers, pharma, or marketers | HIPAA violation, ethical breach |
| Make individual placement decisions without consent | Privacy violation |
| Use data to deny or restrict care | Ethical violation |

### Pricing (Phase 2)

| Tier | Price | Includes |
|------|-------|---------|
| Standard | $149/month | Documentation features (Phase 1) |
| Premium | $249/month | Standard + benchmarking, trend alerts, survey readiness score |

---

## Phase 3: Development Advisory (Month 18+)

### Objective

Use aggregated CareNote data to advise elder housing developers on facility design, resident mix optimization, and market demand.

### How It Works

CareNote's data (fully de-identified) answers questions that developers and investors currently rely on expensive consultants to answer:

| Developer Question | CareNote Data Answer |
|-------------------|---------------------|
| What type of facility should I build here? | Aggregate demand data: most common conditions, care levels, and unmet needs in the area |
| What's the optimal bed count and layout? | Grouping data: which resident profiles coexist well, what common spaces matter |
| What staffing model should I plan for? | Real staffing-to-outcome ratios by facility type and acuity level |
| What are my operating cost projections? | Anonymized operational benchmarks from similar facilities |
| Will this facility fill? | Waitlist indicators and demand signals from nearby facilities |

### Revenue Model (Phase 3)

| Offering | Price | Buyer |
|----------|-------|-------|
| Market demand reports | $2,000–5,000 per report | Senior housing developers |
| Facility design advisory | $10,000–50,000 per engagement | Developers, REITs, non-profits |
| Data licensing | $5,000–20,000/year | Research institutions, policy organizations |
| Placement matching (V3+) | Revenue share with facilities | Families, geriatric care managers |

### Funding Sources for Elder Housing Development

Partners and clients in Phase 3 may access these funding sources:

**Federal Programs:**

| Program | What It Funds |
|---------|--------------|
| HUD Section 202 | Capital advances for senior housing (non-profit sponsors) |
| HUD Section 232 | FHA-insured mortgages for residential care and assisted living |
| Low-Income Housing Tax Credits (LIHTC) | Tax credits for affordable senior housing development |
| USDA Section 515 | Rural senior housing loans |
| Community Development Block Grants (CDBG) | Flexible grants for community development including senior facilities |

**State Programs:**

| Source | Details |
|--------|---------|
| State Housing Finance Agencies | Bond issuance and tax credits for senior housing (CalHFA, TDHCA, etc.) |
| Medicaid Waiver Programs (HCBS) | Fund home and community-based services as nursing home alternatives |
| State licensing incentive programs | Grants or reduced fees for care homes in underserved areas |

**Private Capital:**

| Source | Details |
|--------|---------|
| CDFIs | Mission-driven lenders for senior housing; lower rates |
| Impact investors | Aging-focused funds (Ziegler LinkAge Fund, Aging2.0 network) |
| Senior housing REITs | Welltower, Ventas, Sabra — acquire and develop properties |
| SBA 504 loans | For small business owners building care facilities; up to $5.5M |

### Risks in Phase 3

| Risk | Mitigation |
|------|-----------|
| Insufficient data volume for statistical significance | Don't launch Phase 3 until 200+ facilities and 2,000+ residents |
| Data quality issues from inconsistent documentation | Phase 1 AI structuring ensures consistent categorization |
| Regulatory changes to data use | Maintain conservative de-identification practices; legal review before launch |
| Conflict of interest (advising developers while serving facilities) | Separate advisory arm; transparent data practices; facility consent |

---

## Decision Log

| Decision | Rationale | Revisit When |
|----------|-----------|-------------|
| Build documentation MVP first, not data platform | Data platform requires structured data from real facilities; can't skip collection step | Never — this is foundational |
| Start in California | Most RCFEs, best public licensing data, largest market | Month 3 — expand to WA and TX |
| $149/month flat pricing | Strong ROI for ICP, signals professional tool, sustainable unit economics | Month 6 — test $99 entry tier or $249 premium |
| No equity to pilot facilities | Legal complexity, misaligned incentives | Never — referral commissions instead |
| Solo founder through Phase 1 | Minimize burn, validate PMF before hiring | Month 4–5 — hire part-time customer success |
| Defer HIPAA formal certification | Cost and time; design partners accept informed consent | Month 3 — must have BAA before scaling |
