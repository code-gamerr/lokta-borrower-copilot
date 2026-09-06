import type { Answers, LoanProduct } from './types'

/** EMI for principal P at annual rate r% over n months */
export function emiFor(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  const r = annualRatePct / 12 / 100
  if (r === 0) return principal / months
  const factor = Math.pow(1 + r, months)
  return (principal * r * factor) / (factor - 1)
}

/** Max principal supportable by a monthly EMI ceiling */
export function principalFromEmi(emi: number, annualRatePct: number, months: number): number {
  if (emi <= 0 || months <= 0) return 0
  const r = annualRatePct / 12 / 100
  if (r === 0) return emi * months
  const factor = Math.pow(1 + r, months)
  return (emi * (factor - 1)) / (r * factor)
}

export function totalInterest(principal: number, annualRatePct: number, months: number): number {
  return emiFor(principal, annualRatePct, months) * months - principal
}

/** Rough all-in APR: contractual rate + amortised processing fee */
export function approxApr(ratePct: number, feePct: number, tenureYears: number): number {
  if (tenureYears <= 0) return ratePct + feePct
  return ratePct + feePct / tenureYears
}

export function inr(n: number): string {
  const rounded = Math.round(n)
  return '₹' + rounded.toLocaleString('en-IN')
}

export function inrLakh(n: number): string {
  if (n >= 1_00_000) {
    const l = n / 1_00_000
    return `₹${l.toFixed(l >= 10 ? 0 : 1)}L`
  }
  return inr(n)
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function defaultTenure(product: LoanProduct): number {
  switch (product) {
    case 'home':
      return 240
    case 'lap':
      return 120
    case 'gold':
      return 24
    case 'two_wheeler':
      return 36
    case 'business':
      return 48
    case 'personal':
    default:
      return 48
  }
}

export function tenureChoices(product: LoanProduct): number[] {
  switch (product) {
    case 'home':
      return [120, 180, 240, 300]
    case 'lap':
      return [60, 84, 120, 180]
    case 'gold':
      return [12, 24, 36]
    case 'two_wheeler':
      return [24, 36, 48]
    case 'business':
      return [24, 36, 48, 60]
    case 'personal':
    default:
      return [24, 36, 48, 60]
  }
}

export function productLabel(p: LoanProduct): string {
  const map: Record<LoanProduct, string> = {
    personal: 'Personal loan',
    business: 'Business loan (unsecured)',
    lap: 'Loan against property (LAP)',
    gold: 'Gold loan',
    two_wheeler: 'Two-wheeler loan',
    home: 'Home loan',
  }
  return map[p]
}

export function isSecured(p: LoanProduct): boolean {
  return p === 'lap' || p === 'gold' || p === 'home'
}

/** Must-question completeness for confidence */
export function mustKeys(): (keyof Answers)[] {
  return [
    'purpose',
    'amountWanted',
    'netMonthlyIncome',
    'incomeType',
    'existingEmis',
    'householdExpenses',
    'age',
    'creditScoreKnown',
  ]
}
