# Submission package for Lokta

## Email draft (reply to talent lokta)

**Subject:** Borrower Copilot take-home — Arnav Singh

Hi Lokta team,

Please find my Borrower Copilot submission:

**Repo:** <PASTE_GITHUB_URL_AFTER_PUSH>

### Deliverables (at repo root)
1. Working app — `npm install && npm run dev` (README; < 5 min)
2. `RULES.md` — every threshold / assumption
3. `RUNS.md` — Priya, Ravi, Anita (questions, O1–O4, negotiation card)
4. `WALKTHROUGH.md` + `docs/walkthrough/` — five-minute written walkthrough and visual sequence

### Notes
- Policy engine is source of truth; ML risk is a second signal; OpenRouter only explains grounded JSON (falls back without a key).
- Happy to change any rule live in the follow-up.

Thanks,  
Arnav Singh

---

## After you push

1. Paste your OpenRouter key into `.env` (`OPENROUTER_API_KEY=...`) if you want live AI — **do not commit `.env`**.
2. Create the GitHub repo (or use the remote already added), then:

```bash
cd borrower-copilot
git push -u origin main
```

3. Replace `<PASTE_GITHUB_URL_AFTER_PUSH>` above and send the email.
