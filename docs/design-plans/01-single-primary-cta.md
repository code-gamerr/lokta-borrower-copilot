# Single primary Get started on the first viewport

Written against: `5abe5b1`

## Evidence chain

- Surface: `src/components/Landing.tsx` → `.landing-hero-wrap` (landing phase in `App.tsx`)
- Problem: Nav and hero both render a control labeled **Get started** that calls the same `onGetStarted`
- Design evidence: `Landing.tsx` lines with `landing-nav-cta` and `.landing-cta` `.btn.btn-lg`; both `onClick={onGetStarted}`
- Owner: `Landing` composition + `.landing-nav-cta` / `.landing-cta` in `src/index.css`
- Scope and affected surfaces: Landing hero wrap only (closing CTA in `.landing-section-end` stays)
- Uncertainty: none

## Design decision

Keep **one** primary CTA on the first viewport: the hero **Get started** button. Replace the nav duplicate with a secondary in-page control that scrolls to `#how-it-works` (same destination as the existing “See how it works” text link), so the first screen has a clear primary action hierarchy.

## Reuse

- Existing anchor pattern: `<a className="landing-scroll" href="#how-it-works">`
- Existing nav chrome layout: `.landing-nav`
- Exemplar: hero `.landing-scroll` link in `Landing.tsx`

No new primitive. Prefer an `<a href="#how-it-works">` styled with existing `.landing-nav-cta` (or a `ghost` variant of it) over a second button that duplicates submit intent.

## Changes

1. `src/components/Landing.tsx`
   - Change: Replace nav `<button … onClick={onGetStarted}>Get started</button>` with `<a className="landing-nav-cta" href="#how-it-works">How it works</a>` (or equivalent label that is not “Get started”).
   - Preserve: Hero `.btn.btn-lg` **Get started** → `onGetStarted`; end-section **Get started**; `onGetStarted` wiring in `App.tsx`.
   - Verify: First viewport shows exactly one control whose accessible name is “Get started”.

2. `src/index.css` (only if needed)
   - Change: Ensure `.landing-nav-cta` works for `a` (text-decoration none, display inline-flex, align-items center).
   - Preserve: Visual weight as secondary vs solid hero CTA.
   - Verify: Nav link still sits top-right; keyboard focus ring visible.

## Scope

- Inherit: Landing only
- Verify: Get Started phase still opens from hero and bottom CTAs
- Exclude: Quiz, results, token migration (plan 03), brand wordmark shortening (plan 02)

## Validation

- Product: Land on `/` landing → one primary start path from hero
- Interface: Desktop and ~375px width; Tab to nav then hero CTA; click “How it works” scrolls to `#how-it-works`
- System: No second `onGetStarted` in the hero wrap
- Repository: `npm run build` → success

## Stop conditions

- Stop if product intent requires a persistent top-right **Get started** (then demote hero CTA instead — do not keep both).

## Design documentation

- After acceptance: Note in `AGENTS.md` or a future `DESIGN.md`: “Landing first viewport: single primary CTA (hero Get started); nav uses How it works.”
