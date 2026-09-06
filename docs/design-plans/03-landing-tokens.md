# Landing colors owned by `:root` tokens

Written against: `5abe5b1`

## Evidence chain

- Surface: Landing styles in `src/index.css` (`.landing-hero-wrap`, `.landing-nav-cta`, `.landing-cta`, `.landing-section-trust`, …)
- Problem: Hero/trust use raw hex/rgba (`#14110f`, `#f7f2ea`, …) while the app’s governing palette is `:root` custom properties
- Design evidence: `:root` defines `--ink`, `--bg`, `--accent`, `--copper`, `--accent-ink`; landing block re-hardcodes parallel values
- Owner: `src/index.css` `:root` + landing section rules
- Scope and affected surfaces: Landing CSS consumers in `Landing.tsx` (class names only; ideally no TSX change)
- Uncertainty: Exact token names are new but values should match current rendered look (no intentional rebrand)

## Design decision

Introduce **landing semantic tokens** on `:root` that capture the current dark-hero / light-body look, then replace landing literals with `var(...)`. Preserve visual identity; unify ownership so future polish does not fork hex values.

## Reuse

- Existing `:root` pattern in `src/index.css`
- Keep `--copper` for brand italic accents (already used by `.landing-brand em`)
- Exemplar: body app screens already consume `--accent`, `--bg`, `--ink`

New tokens (add to `:root` — required because no current token means “dark landing plane”):

| Token | Initial value (match current) | Role |
| --- | --- | --- |
| `--landing-bg` | `#14110f` | Hero / trust plane background |
| `--landing-fg` | `#f7f2ea` | Primary text on dark plane |
| `--landing-fg-muted` | `rgba(247, 242, 234, 0.72)` | Support copy on dark |
| `--landing-cta-bg` | `#f7f2ea` | Solid CTA on dark |
| `--landing-cta-fg` | `#14110f` | CTA label on dark |
| `--landing-nav-border` | `rgba(247, 242, 234, 0.35)` | Ghost nav control |

## Changes

1. `src/index.css` `:root`
   - Change: Declare the tokens above next to existing variables.
   - Preserve: Current light-app tokens (`--bg`, `--ink`, `--accent`, …).
   - Verify: Tokens exist and are referenced.

2. `src/index.css` landing rules
   - Change: Replace hardcoded `#14110f`, `#f7f2ea`, and matching rgba text/border/button colors in `.landing-hero-wrap`, `.landing-nav-cta`, `.landing-cta .btn`, `.landing-scroll`, `.landing-support`, `.landing-section-trust` (and related) with the new `var(--landing-*)` (and `--copper` where applicable).
   - Preserve: Layout, motion, section structure; approximate pixel look unchanged.
   - Verify: Grep landing block for `#14110f` / `#f7f2ea` → no stray literals in those roles.

## Scope

- Inherit: All landing dark-plane UI
- Verify: Light `.landing-body` still uses `--bg` / `--ink` / `--accent`
- Exclude: CTA/brand copy changes (plans 01–02); app chrome outside landing; OpenRouter/API

## Validation

- Product: Landing looks the same, maintainable via tokens
- Interface: Hero, trust band, CTAs — spot-check contrast still readable
- System: One owner (`:root`) for landing dark palette
- Repository: `npm run build` → success; optional `rg "#14110f|#f7f2ea" src/index.css` limited to `:root` definitions only

## Stop conditions

- Stop if a visual regression is requested as a rebrand (then update token values once, not scatter hex again).

## Design documentation

- After acceptance: Document landing tokens in `AGENTS.md` or `DESIGN.md` under “Landing semantic tokens.”
