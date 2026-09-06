import type { Answers } from '../../src/engine/types'
import type { Assessment } from '../../src/engine/types'
import type { RiskResult } from '../ml/riskScore'
import { chatCompletion, openRouterConfigured } from './openrouter'

const GROUNDING = `You are the explanation layer for Borrower Copilot, an Indian lending self-assessment.
RULES (non-negotiable):
- Never invent or change numeric outputs (amounts, rates, EMI, verdict). Only explain numbers given in JSON.
- Speak plainly to a borrower walking into a bank branch in India. Use ₹ and FOIR language sparingly with plain English.
- Be honest about uncertainty when confidence is low or score is unknown.
- Do not claim this is a lender offer or bureau pull.
- Keep answers concise.`

export async function explainAssessment(payload: {
  answers: Answers
  assessment: Assessment
  ml: RiskResult
}): Promise<{ narrative: string; source: 'openrouter' | 'fallback' }> {
  if (!openRouterConfigured()) {
    return { narrative: fallbackExplain(payload), source: 'fallback' }
  }

  try {
    const narrative = await chatCompletion(
      [
        { role: 'system', content: GROUNDING },
        {
          role: 'user',
          content: `Write a 4-paragraph plain-language briefing for the borrower covering: (1) verdict and product, (2) why lender amount ≠ safe amount, (3) fair rate/APR and what to say in branch, (4) stress/ML risk in one sentence. JSON:\n${JSON.stringify(payload)}`,
        },
      ],
      { temperature: 0.25, maxTokens: 650 },
    )
    return { narrative, source: 'openrouter' }
  } catch {
    return { narrative: fallbackExplain(payload), source: 'fallback' }
  }
}

export async function copilotChat(payload: {
  answers: Answers
  assessment: Assessment
  ml: RiskResult
  history: { role: 'user' | 'assistant'; content: string }[]
  message: string
}): Promise<{ reply: string; source: 'openrouter' | 'fallback' }> {
  if (!openRouterConfigured()) {
    return {
      reply: fallbackChat(payload.message, payload.assessment, payload.ml),
      source: 'fallback',
    }
  }

  try {
    const reply = await chatCompletion(
      [
        {
          role: 'system',
          content: `${GROUNDING}\nGround truth JSON:\n${JSON.stringify({
            assessment: payload.assessment,
            ml: payload.ml,
            answers: payload.answers,
          })}`,
        },
        ...payload.history.slice(-8).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: payload.message },
      ],
      { temperature: 0.3, maxTokens: 500 },
    )
    return { reply, source: 'openrouter' }
  } catch {
    return {
      reply: fallbackChat(payload.message, payload.assessment, payload.ml),
      source: 'fallback',
    }
  }
}

function fallbackExplain(payload: {
  assessment: Assessment
  ml: RiskResult
}): string {
  const a = payload.assessment
  return [
    `${a.verdict === 'dont_borrow' ? "Don't borrow right now" : a.verdict === 'borrow_less' ? 'Borrow less than you asked' : 'Borrowing can work'} — ${a.verdictWhy}`,
    `A lender may look at ~₹${a.amounts.lenderLikely.toLocaleString('en-IN')} while your safe carry is ~₹${a.amounts.borrowerSafe.toLocaleString('en-IN')}. ${a.amounts.whyRecommend}`,
    `Fair contractual rate: ${a.rate.low}%–${a.rate.high}% (APR ~${a.apr.low}%–${a.apr.high}% including ~${a.apr.feePct}% fee). ${a.rateWhy}`,
    `EMI ceiling ₹${a.emi.ceiling.toLocaleString('en-IN')}/mo. ${payload.ml.summary} (Set OPENROUTER_API_KEY for a richer AI briefing.)`,
  ].join('\n\n')
}

function fallbackChat(message: string, a: Assessment, ml: RiskResult): string {
  const q = message.toLowerCase()
  if (q.includes('rate') || q.includes('interest') || q.includes('apr')) {
    return `Fair band is ${a.rate.low}%–${a.rate.high}% contractual, APR ~${a.apr.low}%–${a.apr.high}% with fees. ${a.rateWhy}`
  }
  if (q.includes('emi') || q.includes('monthly')) {
    return `Do not agree EMI above ₹${a.emi.ceiling.toLocaleString('en-IN')}. ${a.emi.why}`
  }
  if (q.includes('why') || q.includes('dont') || q.includes("don't") || q.includes('verdict')) {
    return a.verdictWhy
  }
  return `${a.verdictWhy}\n\n${ml.summary}\n\n(Tip: add OPENROUTER_API_KEY to .env for full AI chat.)`
}
