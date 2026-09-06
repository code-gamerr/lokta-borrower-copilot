import type { Answers, IncomeType, LoanProduct } from './types'

export type FieldType = 'text' | 'number' | 'select' | 'boolean' | 'currency'

export interface Question {
  id: keyof Answers
  tier: 'must' | 'extra'
  prompt: string
  help?: string
  type: FieldType
  options?: { value: string | number | boolean; label: string }[]
  /** Return false to skip this question */
  showIf?: (a: Answers) => boolean
  /** Short note: which output this extra question moves */
  moves?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

const products: { value: LoanProduct | 'unsure'; label: string }[] = [
  { value: 'unsure', label: 'Not sure — recommend one' },
  { value: 'personal', label: 'Personal loan' },
  { value: 'business', label: 'Business loan' },
  { value: 'lap', label: 'Loan against property' },
  { value: 'gold', label: 'Gold loan' },
  { value: 'two_wheeler', label: 'Two-wheeler loan' },
  { value: 'home', label: 'Home loan' },
]

export const QUESTIONS: Question[] = [
  // —— Must set ——
  {
    id: 'purpose',
    tier: 'must',
    type: 'text',
    prompt: 'What is the loan for?',
    help: 'One line is enough — wedding, stock, scooter, medical…',
    placeholder: 'e.g. Wedding expenses',
  },
  {
    id: 'amountWanted',
    tier: 'must',
    type: 'currency',
    prompt: 'How much do you want to borrow?',
    min: 10_000,
    max: 2_00_00_000,
    step: 10_000,
  },
  {
    id: 'preferredProduct',
    tier: 'must',
    type: 'select',
    prompt: 'Any product in mind?',
    options: products,
  },
  {
    id: 'incomeType',
    tier: 'must',
    type: 'select',
    prompt: 'How do you earn?',
    options: [
      { value: 'salaried', label: 'Salaried' },
      { value: 'self_employed', label: 'Self-employed / business' },
      { value: 'informal', label: 'Informal / gig / cash' },
    ],
  },
  {
    id: 'netMonthlyIncome',
    tier: 'must',
    type: 'currency',
    prompt: 'Net monthly income (your best estimate)',
    help: 'Take-home for salaried. Typical month for others.',
    min: 5_000,
    max: 50_00_000,
  },
  {
    id: 'existingEmis',
    tier: 'must',
    type: 'currency',
    prompt: 'Total EMIs you already pay each month',
    help: 'All loans and BNPL. Enter 0 if none.',
    min: 0,
    max: 20_00_000,
  },
  {
    id: 'householdExpenses',
    tier: 'must',
    type: 'currency',
    prompt: 'Monthly household expenses (excluding EMIs)',
    help: 'Food, school, utilities, transport — not rent if you will enter rent next.',
    min: 0,
    max: 20_00_000,
  },
  {
    id: 'age',
    tier: 'must',
    type: 'number',
    prompt: 'Your age',
    min: 18,
    max: 70,
  },
  {
    id: 'creditScoreKnown',
    tier: 'must',
    type: 'boolean',
    prompt: 'Do you know your credit score?',
    help: 'If no, we keep the rate band wide. We never treat unknown as 300.',
  },
  {
    id: 'creditScore',
    tier: 'must',
    type: 'number',
    prompt: 'What is your credit score?',
    showIf: (a) => a.creditScoreKnown === true,
    min: 300,
    max: 900,
  },

  // —— Extra: each moves a number ——
  {
    id: 'rentMonthly',
    tier: 'extra',
    type: 'currency',
    prompt: 'Monthly rent (if any)',
    moves: 'Tightens safe EMI via living floor',
    showIf: (a) => (a.householdExpenses ?? 0) > 0,
    min: 0,
  },
  {
    id: 'yearsEarning',
    tier: 'extra',
    type: 'number',
    prompt: 'Years in this job / business',
    moves: 'Slightly improves rate band and lender FOIR',
    min: 0,
    max: 40,
  },
  {
    id: 'incomeLow',
    tier: 'extra',
    type: 'currency',
    prompt: 'Income in a slow month',
    moves: 'Sets informal/self-employed income floor',
    showIf: (a) => a.incomeType === 'self_employed' || a.incomeType === 'informal',
  },
  {
    id: 'incomeHigh',
    tier: 'extra',
    type: 'currency',
    prompt: 'Income in a strong month',
    moves: 'With low month, sets cash mid for haircut',
    showIf: (a) => a.incomeType === 'self_employed' || a.incomeType === 'informal',
  },
  {
    id: 'itrAnnual',
    tier: 'extra',
    type: 'currency',
    prompt: 'Annual income on last ITR',
    moves: 'Anchors lender view of self-employed income',
    showIf: (a) => a.incomeType === 'self_employed',
  },
  {
    id: 'coApplicantIncome',
    tier: 'extra',
    type: 'currency',
    prompt: 'Co-applicant / spouse monthly income',
    moves: 'Raises effective income (with haircut)',
    min: 0,
  },
  {
    id: 'collateralValue',
    tier: 'extra',
    type: 'currency',
    prompt: 'Value of property / gold you could pledge',
    moves: 'Routes to LAP/gold and caps LTV amount',
    help: 'Shop, flat, or gold. 0 if none.',
    min: 0,
  },
  {
    id: 'bouncesLast12',
    tier: 'extra',
    type: 'number',
    prompt: 'EMI / mandate bounces in the last 12 months',
    moves: 'Can flip verdict to Don’t; widens rate; cuts FOIR',
    min: 0,
    max: 12,
  },
  {
    id: 'highCostDebtOutstanding',
    tier: 'extra',
    type: 'currency',
    prompt: 'Outstanding on app / payday / 30%+ loans',
    moves: 'Pushes Don’t borrow when combined with bounces',
    min: 0,
  },
  {
    id: 'cardUtilisationPct',
    tier: 'extra',
    type: 'number',
    prompt: 'Credit card utilisation %',
    moves: 'Widens / lifts rate band if ≥70%',
    showIf: (a) => a.incomeType === 'salaried' || a.creditScoreKnown === true,
    min: 0,
    max: 100,
    suffix: '%',
  },
  {
    id: 'emergencyMonths',
    tier: 'extra',
    type: 'number',
    prompt: 'Emergency savings (months of expenses)',
    moves: 'Lowers safe FOIR if under 2 months',
    min: 0,
    max: 24,
  },
  {
    id: 'upcomingLargeExpense',
    tier: 'extra',
    type: 'currency',
    prompt: 'Large expense coming in the next 6 months (besides this loan)',
    moves: 'Cuts safe EMI by 15% if very large',
    min: 0,
  },
  {
    id: 'productiveMonthlyReturn',
    tier: 'extra',
    type: 'currency',
    prompt: 'Extra monthly income this loan should create',
    moves: 'Adds 50% of return to safe EMI (business/vehicle)',
    help: 'Stock margin, delivery earnings… 0 if pure consumption.',
    showIf: (a) => {
      const p = (a.purpose ?? '').toLowerCase()
      return (
        a.incomeType !== 'salaried' ||
        p.includes('business') ||
        p.includes('stock') ||
        p.includes('scooter') ||
        p.includes('vehicle') ||
        a.preferredProduct === 'business' ||
        a.preferredProduct === 'lap' ||
        a.preferredProduct === 'two_wheeler'
      )
    },
    min: 0,
  },
  {
    id: 'offerRatePct',
    tier: 'extra',
    type: 'number',
    prompt: 'Rate already offered by a lender (if any)',
    moves: 'Feeds Negotiation Card walk-away copy',
    min: 5,
    max: 48,
    suffix: '%',
    step: 0.1,
  },
]

export function visibleQuestions(answers: Answers, includeExtra: boolean): Question[] {
  return QUESTIONS.filter((q) => {
    if (q.tier === 'extra' && !includeExtra) return false
    if (q.showIf && !q.showIf(answers)) return false
    return true
  })
}

export function isAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id]
  if (q.type === 'boolean') return v === true || v === false
  return v !== undefined && v !== null && v !== ''
}

export function parseField(q: Question, raw: string): Answers[keyof Answers] {
  if (q.type === 'boolean') return raw === 'true'
  if (q.type === 'text') return raw
  if (q.type === 'select') {
    if (raw === 'true') return true
    if (raw === 'false') return false
    if (q.id === 'incomeType') return raw as IncomeType
    if (q.id === 'preferredProduct') return raw as LoanProduct | 'unsure'
    return raw
  }
  const n = Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}
