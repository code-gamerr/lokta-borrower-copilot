# Borrower Copilot

Microsoft-style full-stack take-home: **auditable policy engine** + **interpretable ML risk** + **OpenRouter AI briefing/chat** + Fluent-inspired UI.

No login. No bureau. No PII stored. Numbers come from rules; the LLM only explains them.

## Architecture

```
browser (Vite/React)
   │  /api/*
   ▼
Express API (:8787)
   ├── assess()      → src/engine  (deterministic FOIR / rates / verdict)
   ├── scoreRisk()   → server/ml   (linear model + feature contributions)
   └── explain/chat  → OpenRouter  (grounded narrative; fallback if no key)
```

| Layer | Role |
|-------|------|
| **Policy** | Source of truth for O1–O4 + negotiation card |
| **ML** | Second signal (0–100 risk) — never overrides verdict |
| **AI** | Explains JSON; cannot invent amounts/rates |

## Run (< 5 minutes)

```bash
cd borrower-copilot
cp .env.example .env
# optional: paste OPENROUTER_API_KEY=sk-or-...
npm install
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:8787/api/health  

Without an OpenRouter key the app still works — AI uses a deterministic fallback.

### Scripts

| Command | What |
|---------|------|
| `npm run dev` | API + Vite together |
| `npm run personas` | Console dump for Priya/Ravi/Anita |
| `npm run build` | Production frontend build |

## API

- `GET /api/health`
- `POST /api/assess` `{ answers }` → `{ assessment, ml, meta }`
- `POST /api/explain` → grounded narrative
- `POST /api/chat` → copilot Q&A
- `GET /api/personas/:id` → preset run-through

## Docs

- [`docs/RULES.md`](./docs/RULES.md) — every threshold
- [`docs/RUNS.md`](./docs/RUNS.md) — three personas
- [`docs/WALKTHROUGH.md`](./docs/WALKTHROUGH.md) — 5-minute demo + next/cut
- [`docs/SUBMIT.md`](./docs/SUBMIT.md) — submission notes

## Layout

```
src/
  api/           HTTP client
  components/    Landing, quiz, results, chat
  engine/        Policy (FOIR, rates, verdict)
  lib/           Shared UI labels
  App.tsx        Phase orchestration
server/
  ml/            Linear risk score
  llm/           OpenRouter + fallback
docs/            RULES, RUNS, walkthrough, design plans
scripts/         Persona CLI
```

## Follow-up ready

Change a FOIR or weight in `src/engine/` or `server/ml/riskScore.ts` — UI and AI pick it up without a redesign.
