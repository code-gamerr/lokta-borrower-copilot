import type { Answers, Assessment } from '../../src/engine/types'

export interface RiskFeature {
  id: string
  label: string
  value: number
  weight: number
  contribution: number
}

export interface RiskResult {
  /** 0 = calm, 100 = severe stress */
  score: number
  label: 'low' | 'moderate' | 'elevated' | 'severe'
  summary: string
  features: RiskFeature[]
  model: string
}

/**
 * Interpretable linear risk model (not a black box).
 * Weights are documented in RULES.md — changeable in the follow-up.
 * Does NOT replace the policy verdict; it is a second signal for the UI.
 */
export function scoreRisk(answers: Answers, assessment: Assessment): RiskResult {
  const income = Math.max(1, answers.netMonthlyIncome ?? 1)
  const existing = answers.existingEmis ?? 0
  const wanted = answers.amountWanted ?? 0
  const safe = Math.max(1, assessment.amounts.borrowerSafe)
  const bounce = answers.bouncesLast12 ?? 0
  const emergency = answers.emergencyMonths ?? 3
  const highCost = answers.highCostDebtOutstanding ?? 0
  const util = answers.cardUtilisationPct ?? 30

  const foirLoad = Math.min(1.5, (existing + assessment.emi.ceiling) / income)
  const wantOverSafe = Math.min(2, wanted / safe)
  const bounceSig = Math.min(1, bounce / 2)
  const informalSig = answers.incomeType === 'informal' ? 1 : answers.incomeType === 'self_employed' ? 0.35 : 0
  const emergencyGap = emergency < 2 ? (2 - emergency) / 2 : 0
  const highCostSig = Math.min(1, highCost / 50_000)
  const utilSig = util >= 70 ? (util - 50) / 50 : 0
  const unknownScore = answers.creditScoreKnown === false ? 0.55 : answers.creditScoreKnown === true && (answers.creditScore ?? 750) < 650 ? 0.7 : 0.1
  const stressFail = assessment.emi.stress.passes ? 0 : 1
  const dont = assessment.verdict === 'dont_borrow' ? 1 : assessment.verdict === 'borrow_less' ? 0.45 : 0

  const raw: Omit<RiskFeature, 'contribution'>[] = [
    { id: 'foir_load', label: 'EMI load vs income', value: foirLoad, weight: 18 },
    { id: 'want_over_safe', label: 'Wanted vs safe amount', value: wantOverSafe, weight: 16 },
    { id: 'bounce', label: 'Recent EMI bounces', value: bounceSig, weight: 20 },
    { id: 'income_type', label: 'Income informality', value: informalSig, weight: 10 },
    { id: 'emergency', label: 'Emergency savings gap', value: emergencyGap, weight: 10 },
    { id: 'high_cost', label: 'High-cost debt overhang', value: highCostSig, weight: 14 },
    { id: 'card_util', label: 'Card utilisation pressure', value: utilSig, weight: 6 },
    { id: 'bureau', label: 'Bureau uncertainty / weakness', value: unknownScore, weight: 8 },
    { id: 'stress', label: 'Stress-test failure', value: stressFail, weight: 12 },
    { id: 'verdict_align', label: 'Policy verdict severity', value: dont, weight: 10 },
  ]

  const features: RiskFeature[] = raw.map((f) => ({
    ...f,
    contribution: Math.round(f.value * f.weight * 10) / 10,
  }))

  const totalWeight = features.reduce((s, f) => s + f.weight, 0)
  const weighted = features.reduce((s, f) => s + f.value * f.weight, 0)
  const score = Math.round(Math.min(100, Math.max(0, (weighted / totalWeight) * 100)))

  const label: RiskResult['label'] =
    score >= 70 ? 'severe' : score >= 50 ? 'elevated' : score >= 30 ? 'moderate' : 'low'

  const top = [...features].sort((a, b) => b.contribution - a.contribution).slice(0, 3)
  const summary = `Risk ${score}/100 (${label}). Top drivers: ${top.map((t) => t.label).join(', ')}.`

  return {
    score,
    label,
    summary,
    features: features.sort((a, b) => b.contribution - a.contribution),
    model: 'borrower-risk-linear-v1',
  }
}
