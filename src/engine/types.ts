export type IncomeType = 'salaried' | 'self_employed' | 'informal'
export type LoanProduct =
  | 'personal'
  | 'business'
  | 'lap'
  | 'gold'
  | 'two_wheeler'
  | 'home'
export type Verdict = 'borrow' | 'borrow_less' | 'dont_borrow'
export type Confidence = 'low' | 'medium' | 'high'

export interface Answers {
  purpose?: string
  amountWanted?: number
  preferredProduct?: LoanProduct | 'unsure'
  netMonthlyIncome?: number
  incomeType?: IncomeType
  existingEmis?: number
  householdExpenses?: number
  age?: number
  creditScoreKnown?: boolean
  creditScore?: number

  // Additional — each must move an output
  yearsEarning?: number
  incomeLow?: number
  incomeHigh?: number
  itrAnnual?: number
  cardUtilisationPct?: number
  bouncesLast12?: number
  emergencyMonths?: number
  collateralValue?: number
  coApplicantIncome?: number
  upcomingLargeExpense?: number
  productiveMonthlyReturn?: number
  offerRatePct?: number
  rentMonthly?: number
  highCostDebtOutstanding?: number
}

export interface RateBand {
  low: number
  high: number
  mid: number
}

export interface AmountPair {
  lenderLikely: number
  borrowerSafe: number
  recommend: 'lender' | 'safe'
  whyLender: string
  whySafe: string
  whyRecommend: string
}

export interface EmiPlan {
  ceiling: number
  tenureMonths: number
  emiAtCeiling: number
  emiAtWanted: number | null
  tenureOptions: { months: number; emi: number; totalInterest: number }[]
  stress: {
    label: string
    emiShareOfIncome: number
    passes: boolean
    detail: string
  }
  why: string
}

export interface Assessment {
  recommendedProduct: LoanProduct
  productWhy: string
  verdict: Verdict
  verdictWhy: string
  amounts: AmountPair
  rate: RateBand
  rateWhy: string
  apr: { low: number; high: number; feePct: number; why: string }
  emi: EmiPlan
  confidence: Confidence
  confidenceWhy: string
  answeredMust: number
  answeredExtra: number
  negotiation: {
    headline: string
    fairBand: string
    talkingPoints: string[]
    walkAway: string
  }
  flags: string[]
}

export type AnswerKey = keyof Answers
