<!--
Read natively by Codex, Cursor, Gemini CLI/Antigravity, Copilot, Aider,
Windsurf, and Zed. install.sh/install.ps1 symlink CLAUDE.md to this file so
Claude Code receives the same context without a duplicate source file.
-->

# What this project is

Borrower Copilot — Lokta take-home. Indian lending self-assessment (policy engine + interpretable ML risk + OpenRouter explain/chat). No login, no bureau, no PII stored.

# Conventions

- Language/framework: Vite + React 19 + TypeScript; Express API in `server/`
- UI: Fluent-inspired light glass tokens in `src/index.css`; accessibility-first (landmarks, live regions, 44px targets)
- Test / verify: `npm run build`, `npm run personas`, `npm run lint`
- Source: `src/` (UI + engine), `server/` (API, ML, OpenRouter)
- Docs: `RULES.md`, `RUNS.md`, `WALKTHROUGH.md`, `docs/walkthrough/`
- Skills: indium-agentkit installed under `.cursor/rules/` ([indium-agentkit](https://github.com/Indium-AI-Labs/indium-agentkit))

# Notes for agents

- Policy numbers live in `src/engine/`; ML in `server/ml/`; LLM must not invent amounts.
- Prefer scoped UI changes in `src/App.tsx` + `src/index.css`.
- Do not commit `.env` (OpenRouter key).
