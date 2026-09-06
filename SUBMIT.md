# Submission package for Lokta

## Email draft (reply to talent lokta)

**Subject:** Borrower Copilot take-home — Arnav Singh

Hi Lokta team,

Please find my Borrower Copilot submission:

**Repo:** https://github.com/code-gamerr/lokta-borrower-copilot  
*(private — I'll share access with you; say if you prefer public)*

### Deliverables (at repo root)
1. Working app — `npm install && npm run dev` (README; under 5 minutes)
2. `RULES.md` — every threshold / assumption
3. `RUNS.md` — Priya, Ravi, Anita (questions, O1–O4, negotiation card)
4. `WALKTHROUGH.md` + `docs/walkthrough/` — five-minute written walkthrough and screenshot sequence

### Notes
- Policy engine is source of truth; ML risk is a second signal; OpenRouter only explains grounded JSON (falls back without a key).
- Happy to change any rule live in the follow-up.

Thanks,  
Arnav Singh

---

## Your push (only GitHub step left)

Remote is already set. From this folder:

```bash
git push -u origin main
```

Then invite Lokta on the private repo (or make it public) and send the email above.

## OpenRouter (optional live AI)

Local `.env` exists and is **gitignored**. Paste your key:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Restart `npm run dev`. Without a key, briefing/chat use deterministic fallback.
