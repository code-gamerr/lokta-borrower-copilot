# One brand lockup on the landing hero

Written against: `5abe5b1`

## Evidence chain

- Surface: `src/components/Landing.tsx` → `.landing-hero-wrap`
- Problem: Full brand string **Borrower Copilot** appears twice — `.landing-wordmark` in nav and `h1.landing-brand`
- Design evidence: Identical copy in nav `<p className="landing-wordmark">` and `<h1 id="landing-brand" className="landing-brand">`; user screenshot of first viewport
- Owner: `Landing` + `.landing-wordmark` / `.landing-brand` in `src/index.css`
- Scope and affected surfaces: Landing hero nav + hero heading; Get Started still uses `.landing-wordmark.compact` (out of scope unless it conflicts)
- Uncertainty: none for landing hero; Get Started compact wordmark may stay as full brand on a later screen

## Design decision

Treat the large `h1.landing-brand` as the only full brand lockup on the landing first viewport. Shorten the nav mark to **Copilot** (italic/`em`, copper) so brand hierarchy is hero-first without repeating “Borrower Copilot”.

## Reuse

- `.landing-wordmark` / `em` copper italic styling already in `index.css`
- `--copper`, `--display`
- Exemplar: `.landing-brand em` treatment for “Copilot”

No new primitive.

## Changes

1. `src/components/Landing.tsx`
   - Change: In `.landing-nav`, replace  
     `Borrower <em>Copilot</em>`  
     with  
     `<em>Copilot</em>`  
     (optionally wrap in `.landing-wordmark` still). Keep `h1.landing-brand` as `Borrower <em>Copilot</em>`.
   - Preserve: Hero brand size, copper italic on Copilot, Get Started phase wordmark unless separately requested.
   - Verify: First viewport announces one full “Borrower Copilot” heading; nav shows short mark only.

2. `src/index.css` (optional polish)
   - Change: If short nav mark needs size tweak, add `.landing-wordmark.nav-only { font-size: … }` — only if default looks wrong.
   - Preserve: Existing `.landing-wordmark.compact` for Get Started.
   - Verify: Nav mark aligns with “How it works” control from plan 01.

## Scope

- Inherit: Landing hero wrap
- Verify: Get Started header still readable with full or compact brand (no change required)
- Exclude: CTA dedupe (plan 01), token migration (plan 03), below-fold sections

## Validation

- Product: Brand reads as hero-level, not double-logo
- Interface: 1280px and 375px; screenshot first viewport — one full lockup
- System: No duplicate `h1`; nav is not an `h1`
- Repository: `npm run build` → success

## Stop conditions

- Stop if legal/brand guidelines require the full wordmark in the nav chrome (then shrink nav typography instead of shortening copy — still must not match `h1` size).

## Design documentation

- After acceptance: “Landing nav uses short mark (Copilot); full Borrower Copilot lockup is the hero `h1` only.”
