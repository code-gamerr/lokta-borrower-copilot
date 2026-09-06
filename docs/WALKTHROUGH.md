# Five-minute walkthrough

## Stack in one sentence

Fluent-style React UI → Express API → **policy engine** (numbers) + **linear ML risk** (explainable score) + **OpenRouter** (grounded narrative/chat).

## Demo path (≈5 minutes)

See also the visual beat sheet: [`walkthrough/README.md`](./walkthrough/README.md).

1. Landing → **Get started** → self-assessment (or a persona).
2. Tap **Priya** → show dual amounts (lender vs safe), rate band + APR, EMI ceiling.
3. Point at **ML risk** panel — feature contribution bars (not a black box).
4. Scroll **AI briefing** (OpenRouter if keyed, else fallback).
5. Ask copilot: “Why is safe lower than the lender number?”
6. Open dark **Negotiation Card** → Print.
7. **Ravi** → LAP routing + wide rate (score unknown ≠ 300).
8. **Anita** → **Don't borrow** fires; ML risk elevated/severe.

## What I would build next

1. Offer-compare: paste 3 lender quotes; highlight APR vs fair band.
2. Anita refinance path before any new ticket.
3. Optional account-aggregator income (consent) to tighten self-employed bands.
4. Versioned `rulesetId` on the printed card.

## What I would cut

1. Deep home-loan UX — personas don't need it.
2. LLM inventing numbers — deliberately forbidden.
3. Black-box ML — linear + contributions only.

## Limits

- Simplified APR (fee / years).
- Collateral/income borrower-stated.
- Without `OPENROUTER_API_KEY`, explain/chat use deterministic fallback.

## Follow-up

Edit `src/engine/` or `server/ml/riskScore.ts`, re-run persona — UI/AI follow.
