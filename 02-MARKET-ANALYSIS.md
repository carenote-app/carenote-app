# CareNote — Market Analysis

## Target Market

### Primary: Residential Care Homes (RCFEs, Adult Family Homes, Board-and-Care)

Small, licensed residential facilities that provide non-medical care to elderly adults. Known by different names depending on the state:

| State | Name | Licensing Body |
|-------|------|----------------|
| California | Residential Care Facility for the Elderly (RCFE) | Community Care Licensing (CDSS) |
| Washington | Adult Family Home | DSHS |
| Texas | Assisted Living Facility (Type A/B) | HHSC |
| Florida | Assisted Living Facility | AHCA |
| Oregon | Adult Foster Home / Residential Care Facility | DHS |

**Market size:** ~30,000 facilities with fewer than 20 beds in the US.

**Characteristics:**
- 4–20 beds, typically in a converted residential home
- Owner-operated (owner is often also a caregiver)
- 2–10 staff, mostly part-time, high turnover
- Revenue: $3,000–6,000/month per resident ($36K–$1.2M annual revenue)
- Low technology adoption — paper binders, basic spreadsheets, group texts

### Secondary: Small Home-Care Agencies

Companies employing 5–30 home-care aides who visit clients in their homes.

**Market size:** ~400,000 agencies in the US (vast majority are small).

**Key difference from RCFEs:** No facility to manage, but same documentation needs — shift notes, family communication, incident reporting. Added complexity: no central location, so documentation happens in the field.

### Deferred Markets

| Market | Why Defer |
|--------|-----------|
| Hospice and palliative care | Different regulatory framework, emotional tone requirements, interdisciplinary team workflows |
| Skilled nursing facilities (SNFs) | Enterprise buyers, complex EHR requirements, longer sales cycles |
| Memory care units | Specialized documentation needs, different incident categories |
| Adult day programs | Different service model, different documentation cadence |

## Ideal Customer Profile (ICP)

### Firmographic Criteria

| Attribute | Ideal |
|-----------|-------|
| Facility type | Residential care home (RCFE, AFH, or equivalent) |
| Bed count | 6–16 beds |
| Staff size | 3–8 caregivers |
| Annual revenue | $200K–$1M |
| Location | Suburban or urban (reliable internet) |
| Current documentation | Paper-based or basic digital (Google Docs, texting) |
| Owner involvement | Owner is hands-on, involved in daily operations |

### Behavioral Criteria

| Signal | Why It Matters |
|--------|---------------|
| Recently cited on a state survey for documentation gaps | Immediate pain, willing to pay for a solution |
| Family complaints about communication | Feels the pain of poor family updates |
| New facility (< 2 years old) | Hasn't built ingrained habits yet, open to tools |
| Owner active in Facebook groups or associations | Reachable through community channels |
| Recently hired new caregivers | Needs onboarding support, wants consistency |

## User Personas

### Persona 1: Maria — Owner-Operator

| Attribute | Detail |
|-----------|--------|
| Role | Owns and manages a 12-bed RCFE in Sacramento, CA |
| Age | 48 |
| Background | Former CNA, opened her own home 5 years ago |
| Team | 6 caregivers across 3 shifts |
| Tech comfort | Uses iPhone daily, comfortable with apps, uncomfortable with complex admin panels |
| Daily pain | Spends 2+ hours after her shift reviewing and rewriting caregiver notes, texting families from her personal phone |
| Buying trigger | State survey coming up in 3 months; last survey cited her for incomplete documentation |
| Budget | $100–$300/month for something that actually saves time |
| Where to find her | Facebook group "RCFE Owners California," local RCFE association meetings |

### Persona 2: James — Shift Caregiver

| Attribute | Detail |
|-----------|--------|
| Role | Day-shift caregiver at Maria's facility |
| Age | 32 |
| Background | 4 years as a caregiver, no formal medical training |
| Tech comfort | Uses his phone for everything, fast texter, doesn't like typing on computers |
| Pain | Supposed to write notes for 12 residents every shift — usually does it from memory at the end of shift, misses details |
| Motivation | Wants to finish documentation fast and go home on time |
| What he needs | A tool that takes 30 seconds per resident, not 5 minutes |

### Persona 3: Sarah — Family Member

| Attribute | Detail |
|-----------|--------|
| Role | Daughter of a resident at Maria's facility |
| Age | 52 |
| Pain | Worries about her mother, calls the facility 2–3x/week, feels she's "bothering" the staff |
| What she wants | Regular, proactive updates — not just hearing when something goes wrong |
| Interaction with CareNote | Receives family update emails (read-only, no login in V1) |

## Competitive Landscape

### Direct Competitors

| Tool | Target Market | Price | Strengths | Weaknesses for Our ICP |
|------|--------------|-------|-----------|----------------------|
| **PointClickCare** | Large SNFs (100+ beds) | $500–2,000/month | Full EHR, billing, pharmacy integration | Way too complex and expensive for a 12-bed home |
| **MatrixCare** | Mid-to-large assisted living | $400–1,500/month | Comprehensive, established | Enterprise sales process, not built for small homes |
| **Alora** | Home health agencies | $200–500/month | Good mobile app, scheduling | Focused on home health (Medicare), not residential care |
| **CareSmartz360** | Home care agencies | $300+/month | Scheduling, EVV, billing | Scheduling-focused, weak on documentation quality |
| **Eldermark** | Mid-size assisted living | Custom pricing | Good reporting | Not designed for < 20 beds |

### Indirect / Partial Competitors

| Tool | What It Does | Gap |
|------|-------------|-----|
| **Google Docs / Sheets** | Generic document editing | No structure, no AI, no compliance awareness |
| **WhatsApp / iMessage** | Staff and family communication | No audit trail, no structure, HIPAA risk |
| **Notion / Airtable** | Flexible databases | Requires setup, no AI structuring, no family-facing output |
| **ChatGPT / Claude.ai** | AI text generation | No workflow, no resident context, no storage, no compliance |
| **Homebase / When I Work** | Scheduling | Doesn't touch documentation at all |

### CareNote's Competitive Advantage

| Dimension | CareNote's Position |
|-----------|-------------------|
| **Price** | $149/month flat — 3–10x cheaper than enterprise tools |
| **Complexity** | Single-purpose: documentation. No scheduling, billing, pharmacy, or EHR bloat |
| **AI-native** | Built around Claude from day one, not bolted on. Every input goes through AI structuring. |
| **Family communication** | First-class feature, not an afterthought. Warm, professional, one-click send. |
| **Time to value** | 10 minutes from signup to first structured note. No implementation project. |
| **ICP focus** | Built exclusively for 4–20 bed facilities. Every design decision reflects this. |

## Pricing Analysis

### Price Sensitivity of the ICP

- A 12-bed facility generating $50,000/month in resident fees can easily afford $149/month
- The tool replaces 2+ hours/day of owner time — at $30/hour equivalent, that's $1,800/month of labor saved
- ROI ratio: 12:1 ($1,800 saved / $149 cost)

### Why $149/Month (Not $49, Not $299)

| Price Point | Argument For | Argument Against | Decision |
|-------------|-------------|-----------------|----------|
| $49/month | Lower barrier, faster adoption | Signals low quality, hard to build a business | Too low |
| $99/month | Accessible, easy to expense | Leaves money on the table given the value delivered | Possible for entry tier later |
| **$149/month** | **Strong ROI, signals professional tool, sustainable business** | **Some very small homes (4 beds) may hesitate** | **MVP price** |
| $249/month | Higher revenue per customer | May slow early adoption when trust is unproven | V2 premium tier |
| $499/month | Premium positioning | Competes on price with enterprise tools that offer more features | Too high for ICP |

### Pricing Structure

| Plan | Price | Includes |
|------|-------|---------|
| **Trial** | Free / 14 days | Full access, up to 20 residents |
| **Standard** | $149/month | Up to 20 residents, unlimited users, unlimited notes, email delivery |
| **Growth** (V2) | $249/month | Up to 50 residents, benchmarking analytics, SMS delivery, priority support |

**No per-user pricing.** Small care homes have variable staff and shouldn't be penalized for adding a new aide.

## Market Timing and Macro Environment

### Recession Resilience

Elder care is non-discretionary. Key factors that make CareNote recession-resistant:

1. **Demand for small care homes increases during recessions.** Families move elderly relatives from expensive nursing homes ($8–12K/month) to cheaper residential care ($3–5K/month).
2. **Documentation requirements don't pause.** State licensing and survey schedules continue regardless of economic conditions.
3. **$149/month is below the cut threshold.** For a business generating $20K–80K/month in revenue, $149 is not a discretionary expense — especially when it saves 2 hours/day of labor.
4. **Labor cost inflation strengthens the pitch.** As caregiver wages rise, the ROI of automating documentation improves.

### Structural Tailwinds

- 10,000 Americans turn 65 every day (through 2030)
- Post-COVID regulatory scrutiny on care documentation increasing
- Government spending on elder care (Medicare/Medicaid) is politically untouchable — accountability/documentation requirements will only increase
- AI cost curves continue to decline, improving margins over time
