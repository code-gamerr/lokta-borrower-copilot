# Landing polish — execute all

Selected: findings **1 + 2 + 3** (best-case mix).

## Order

1. [01-single-primary-cta.md](./01-single-primary-cta.md) — one Get started on first viewport  
2. [02-single-brand-lockup.md](./02-single-brand-lockup.md) — nav short mark, hero full brand  
3. [03-landing-tokens.md](./03-landing-tokens.md) — move landing hex into `:root` tokens  

Do **01 → 02** before **03** so class/markup churn settles, then token-swap CSS.

## Executor skill

Prefer **baseline-ui** (spacing/hierarchy/type). Do not expand into quiz/results redesign.

## Done when

- First viewport: one **Get started**, one full **Borrower Copilot** `h1`, short nav mark  
- Landing dark colors referenced via `--landing-*`  
- `npm run build` passes  
