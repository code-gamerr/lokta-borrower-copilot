# RULES.md

Every threshold the engine uses. Format: **what · value · why · source**.

> This is a borrower **self-assessment**, not a credit model. Numbers are judgement bands meant to be explained and changed live — not bureau-validated scores.

---

## Product routing

| What | Value | Why | Source |
|------|-------|-----|--------|
| Business purpose + collateral ≥ ₹5L | Route to **LAP** | Unsecured business/personal rates are the wrong quote when property can carry the deal | My judgement; common LAP practice |
| Vehicle / scooter purpose ≤ ₹3L | Route to **two-wheeler** | Asset-backed finance usually cheaper than personal loan | Market practice |
| Wedding / consumption | **Personal loan** | No productive cashflow to underwrite | My judgement |
| Gold-sized collateral, small ticket | Prefer **gold** over thin LAP | Speed + LTV clarity | Market practice |

---

## Income (effective monthly)

| What | Value | Why | Source |
|------|-------|-----|--------|
| Salaried | Net take-home as stated | Closest to what FOIR uses | Standard |
| Co-applicant (salaried/self-emp) | **70%** of stated | Joint income is not fully fungible | My judgement |
| Co-applicant (informal primary) | **50%** | Higher uncertainty | My judgement |
| Self-employed cash mid | **70%** haircut | Lenders distrust cash books | Common underwriting practice |
| Self-employed with ITR | Anchor on **ITR/12**, allow up to 1.25× if cash supports | Declared income is what many NBFCs start from | My judgement |
| Informal | **85% of low/stable month** | Gig income is volatile; use the floor | My judgement |

**Unknown is never zero:** missing ITR → cash haircut path with wider confidence, not ₹0 income.

---

## FOIR caps

### Lender FOIR (sanction view)

| Product | FOIR | Why | Source |
|---------|------|-----|--------|
| Personal / two-wheeler | **50%** | Typical unsecured / retail cap | Common Indian retail practice |
| Business unsecured | **45%** | Cashflow noisier | My judgement |
| LAP / gold / home | **55%** | Secured book tolerates higher | Common secured practice |

### Borrower-safe FOIR (what the borrower should use)

| Product | FOIR | Why | Source |
|---------|------|-----|--------|
| Personal / two-wheeler | **40%** | Leave buffer lenders will not leave you | My judgement |
| Business unsecured | **35%** | Income variance | My judgement |
| LAP / gold / home | **45%** | Still below lender | My judgement |

### FOIR adjustments

| Trigger | Effect | Why | Source |
|---------|--------|-----|--------|
| Informal income | −5 pts both | Underwriting uncertainty | My judgement |
| Bounce in last 12 months | −5 lender, **−8 safe** | Bounce is the best predictor of the next bounce | My judgement |
| Emergency savings &lt; 2 months | −5 safe | No shock absorber | My judgement |
| Salaried 5+ years | +3 lender only | Stability helps sanction, not lifestyle FOIR | My judgement |
| High-cost debt &gt; ₹20k | −5 safe | Already in a costly hole | My judgement |
| Clamps | Lender 30–60%; safe ≤ lender−3 pts | Keep numbers sane | My judgement |

---

## Living floor

| What | Value | Why | Source |
|------|-------|-----|--------|
| Floor | `max(expenses + rent, 25% of income)` | EMI must not eat essentials | My judgement |
| Safe EMI cap | `min(income×safeFOIR − existing EMIs, income − existing − floor)` | FOIR alone ignores rent/food | My judgement |
| Lender EMI cap | Also capped so ≥15% of income remains | Crude lender residual | My judgement |
| Upcoming expense &gt; 2× income | Safe EMI × **0.85** | Near-term cash drain | My judgement |
| Productive monthly return | **+50%** of stated return to safe EMI (business / LAP / two-wheeler only) | Do not fully bank projected earnings | My judgement |

---

## Amount (O2)

| What | Value | Why | Source |
|------|-------|-----|--------|
| Lender likely | Principal from lender EMI cap @ mid rate @ default tenure | What FOIR math suggests they *could* clear | Derived |
| Borrower safe | Principal from safe EMI cap @ **top of rate band**, then **stress-trimmed** | Safer rate + bad-month survival | My judgement |
| Stress trim | Binary-search principal until income−20% **or** rate+3 pts still clears living floor | O2 and O4 must agree | My judgement |
| LAP LTV | **55%** of collateral; safe uses 90% of that | Conservative residential/commercial LAP | Market band; my judgement on 55% |
| Gold LTV | **75%** | Typical gold loan LTV ceiling | Market practice |
| Two-wheeler absolute cap | Lender ₹2.5L / safe ₹2L | Ticket sanity | My judgement |
| Rounding | Nearest ₹10,000 | Branch-usable numbers | My judgement |
| Which to use | Always recommend **safe**, never lender max | Product thesis | Challenge brief |

---

## Rate bands (O3) — contractual

### Personal (base by score)

| Score | Band | Why | Source |
|-------|------|-----|--------|
| ≥780 | 10.5–12.5% | Prime bank/NBFC | Approx. 2024–26 market; my judgement |
| ≥750 | 11–13.5% | Strong | My judgement |
| ≥700 | 12.5–15% | Good | My judgement |
| ≥650 | 15–18% | Fair | My judgement |
| &lt;650 | 18–24% | Weak / often declined | My judgement |
| **Unknown** | **13–18% wide** | Not modelled as 300 | Challenge rule |

### Other products (base)

| Product | Band intuition | Source |
|---------|----------------|--------|
| LAP, score unknown | 10.5–14% | Property carries deal |
| LAP, score ≥750 | 9.5–11.5% | Secured prime |
| Gold | 9–12% | Asset-priced |
| Two-wheeler, thin/informal | 14–20% | Dealer/NBFC |
| Two-wheeler, score ≥750 | 11–14% | Bank |
| Business unsecured, no score | 14–20% | Cashflow underwriting |

### Rate adjustments

| Trigger | Effect | Why | Source |
|---------|--------|-----|--------|
| Bounce &gt; 0 | +1.5 / +2.5 pts | Repricing + decline risk | My judgement |
| Card util ≥70% | +0.5 / +1 pt | Leverage signal | Bureau practice (approx.) |
| Years earning ≥5 (not informal) | −0.25 both | Mild stability bonus | My judgement |
| Informal + unsecured | +1 / +2 | Risk premium | My judgement |
| Score unknown (engine) | Widen further (−0.5 low, +1.5 high) | Confidence honesty | Challenge rule |
| Low confidence | +1 to high | Sparse answers | Challenge rule |

### Processing fee → APR

| Product | Fee assumption | APR approx | Source |
|---------|----------------|------------|--------|
| Personal | **2%** | `rate + fee/tenure_years` | Typical PL fee; simplified APR |
| Business | **2.5%** | same | My judgement |
| Two-wheeler | **2%** | same | My judgement |
| LAP / home / gold | **1%** | same | My judgement |

> Honest limit: this is **not** a full RBI IRR schedule with GST, insurance, and EMI-in-advance. It is directionally comparable for negotiation. Documented as simplified.

---

## Default tenures

| Product | Default months | Choices shown |
|---------|----------------|---------------|
| Personal | 48 | 24 / 36 / 48 / 60 |
| Business | 48 | 24 / 36 / 48 / 60 |
| Two-wheeler | 36 | 24 / 36 / 48 |
| Gold | 24 | 12 / 24 / 36 |
| LAP | 120 | 60 / 84 / 120 / 180 |
| Home | 240 | 120 / 180 / 240 / 300 |

---

## Verdict (O1)

| Condition | Verdict | Why | Source |
|-----------|---------|-----|--------|
| High-cost debt + bounce + unsecured personal/business | **Don't** | Stacking trap | My judgement |
| Informal + bounce + high-cost debt + not gold | **Don't** | Anita-class profile | My judgement |
| Existing EMIs already &gt; safe FOIR | **Don't** | No headroom | Derived |
| Safe amount &lt; ₹25k while wanting a loan | **Don't** | Meaningless ticket | My judgement |
| Wanted &gt; safe × 1.05 | **Borrow less** | Use safe ceiling | Derived |
| Wanted &gt; lender likely | **Borrow less** / change product | Sanction gap | Derived |
| Else | **Borrow** | Fits safe + sanction | Derived |

---

## Confidence

| Signal | Effect | Why | Source |
|--------|--------|-----|--------|
| Must answers (8) | +8 each toward score | Core completeness | My judgement |
| Extra answers | +5 each | Each must move a number | Challenge |
| Score unknown | −8 | Widen bands | Challenge |
| Self-emp without ITR | −6 | Income uncertain | My judgement |
| Informal | −4 | Same | My judgement |
| Score ≥85 / ≥55 | high / medium else low | Shown in UI | My judgement |

---

## Questions

### Must (engine still works with only these)

Purpose, amount wanted, product preference, income type, net monthly income, existing EMIs, household expenses, age, credit score known (+ score if yes).

### Extra (each moves an output — see UI “Moves:” line)

Rent, years earning, income low/high, ITR, co-applicant income, collateral, bounces, high-cost debt outstanding, card utilisation, emergency months, upcoming expense, productive return, offer rate already received.

### Adaptive skips

| Path | Skips / shows |
|------|----------------|
| Salaried | Skip ITR, income low/high (unless extras forced) |
| Self-employed | Show ITR + low/high |
| Informal | Show low/high; skip card util unless score known |
| Score unknown | Skip numeric score question |
| Non-productive salaried | Skip productive-return unless purpose/product suggests asset |

---

## ML risk model (`borrower-risk-linear-v1`)

Interpretable weighted sum → score 0–100. **Does not override policy verdict.**

| Feature | Weight | Why | Source |
|---------|--------|-----|--------|
| EMI load vs income | 18 | Affordability pressure | My judgement |
| Wanted vs safe amount | 16 | Over-ask risk | My judgement |
| Recent EMI bounces | 20 | Strong distress signal | My judgement |
| Income informality | 10 | Underwriting noise | My judgement |
| Emergency savings gap | 10 | Shock absorber missing | My judgement |
| High-cost debt overhang | 14 | Stacking trap | My judgement |
| Card utilisation pressure | 6 | Leverage | My judgement |
| Bureau uncertainty / weakness | 8 | Unknown ≠ 300, but uncertainty remains | My judgement |
| Stress-test failure | 12 | Aligns with O4 | Derived |
| Policy verdict severity | 10 | Soft alignment feature | My judgement |

Labels: &lt;30 low · &lt;50 moderate · &lt;70 elevated · else severe.

## OpenRouter (AI layer)

| What | Value | Why | Source |
|------|-------|-----|--------|
| Role | Explain / chat only | Numbers stay in policy engine | Product decision |
| Default model | `openai/gpt-4o-mini` | Cheap, fast; override via `OPENROUTER_MODEL` | My judgement |
| No API key | Deterministic fallback text | App must run offline for graders | Challenge |
| Grounding | Assessment + ML JSON in prompt | Prevents invented EMIs | Engineering |

---

## What we do **not** know (honesty)

| Gap | How the app behaves |
|-----|---------------------|
| True bureau file / FOIR policy of a named bank | Bands, not points; confidence label |
| Actual property title / gold purity | Collateral value taken as borrower-stated |
| GST on fees, insurance, floating reset | Simplified APR |
| Local micro-market rates (Hubballi vs Bengaluru desks) | National-ish bands |
| Behavioural fraud / account aggregators | Out of scope |
| Exact EMI on Anita’s three app loans | Persona uses ₹8,000 estimate — changeable |

If a rule above says **my judgement**, expect to change it in the follow-up session without rewriting the UI — edit `src/engine/` or `server/ml/`.
