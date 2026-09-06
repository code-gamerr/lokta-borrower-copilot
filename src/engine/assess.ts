import type { Answers, Assessment, Confidence, Verdict } from './types'
import {
  approxApr,
  clamp,
  defaultTenure,
  emiFor,
  inr,
  isSecured,
  mustKeys,
  pct,
  principalFromEmi,
  productLabel,
  roundTo,
  tenureChoices,
  totalInterest,
} from './math'
import { fairRateBand, processingFeePct, recommendProduct } from './products'

/** Lender FOIR caps by product — what underwriters often allow. */
export const LENDER_FOIR: Record<string, number> = {
  personal: 0.5,
  business: 0.45,
  two_wheeler: 0.5,
  gold: 0.55,
  lap: 0.55,
  home: 0.55,
}

/** Borrower-safe FOIR — deliberately tighter than lender. */
export const SAFE_FOIR: Record<string, number> = {
  personal: 0.4,
  business: 0.35,
  two_wheeler: 0.4,
  gold: 0.45,
  lap: 0.45,
  home: 0.45,
}

function effectiveIncome(a: Answers): { income: number; why: string } {
  const stated = a.netMonthlyIncome ?? 0
  const type = a.incomeType ?? 'salaried'
  const co = a.coApplicantIncome ?? 0
  const low = a.incomeLow
  const high = a.incomeHigh
  const itr = a.itrAnnual

  if (type === 'salaried') {
    return {
      income: stated + co * 0.7,
      why:
        co > 0
          ? `Salaried net ${inr(stated)} plus 70% of co-applicant ${inr(co)} (haircut for joint underwriting).`
          : `Salaried net take-home ${inr(stated)}.`,
    }
  }

  if (type === 'self_employed') {
    const rangeMid =
      typeof low === 'number' && typeof high === 'number' ? (low + high) / 2 : stated
    const cashHaircut = rangeMid * 0.7 // lenders distrust cash books
    const itrMonthly = typeof itr === 'number' && itr > 0 ? itr / 12 : null
    // Lender income ≈ max of ITR path and haircut cash, but not fantasy highs
    let lenderView: number
    let why: string
    if (itrMonthly != null) {
      lenderView = Math.max(itrMonthly, Math.min(cashHaircut, itrMonthly * 1.25))
      why = `Self-employed: ITR implies ${inr(itrMonthly)}/mo; cash range mid ${inr(rangeMid)} haircut 30% → ${inr(cashHaircut)}. Using ${inr(lenderView)} (ITR-anchored).`
    } else {
      lenderView = cashHaircut
      why = `Self-employed without ITR: using 70% of cash mid ${inr(rangeMid)} = ${inr(lenderView)}. Wide uncertainty.`
    }
    return { income: lenderView + co * 0.7, why }
  }

  // informal
  const floor =
    typeof low === 'number' ? low : stated > 0 ? stated * 0.9 : 0
  const informal = floor * 0.85
  return {
    income: informal + co * 0.5,
    why: `Informal income: using 85% of low/stable figure ${inr(floor)} = ${inr(informal)} (lenders haircut gig/cash).`,
  }
}

function foirCaps(a: Answers, product: string): { lender: number; safe: number; why: string } {
  let lender = LENDER_FOIR[product] ?? 0.5
  let safe = SAFE_FOIR[product] ?? 0.4
  const parts: string[] = []

  if (a.incomeType === 'informal') {
    lender -= 0.05
    safe -= 0.05
    parts.push('informal income (−5 pts FOIR)')
  }
  if ((a.bouncesLast12 ?? 0) > 0) {
    lender -= 0.05
    safe -= 0.08
    parts.push('recent bounce (stricter safe FOIR)')
  }
  if ((a.emergencyMonths ?? 99) < 2) {
    safe -= 0.05
    parts.push('under 2 months emergency savings')
  }
  if ((a.yearsEarning ?? 0) >= 5 && a.incomeType === 'salaried') {
    lender += 0.03
    parts.push('5+ years salaried (+3 pts lender FOIR)')
  }
  if ((a.highCostDebtOutstanding ?? 0) > 20_000) {
    safe -= 0.05
    parts.push('existing high-cost debt')
  }

  lender = clamp(lender, 0.3, 0.6)
  safe = clamp(safe, 0.2, lender - 0.03)

  return {
    lender,
    safe,
    why: parts.length ? parts.join('; ') : 'standard product FOIR',
  }
}

function livingFloor(a: Answers, income: number): number {
  const expenses = a.householdExpenses ?? income * 0.4
  const rent = a.rentMonthly ?? 0
  // Rent is additive when entered separately; otherwise expenses should already include housing.
  return Math.max(expenses + rent, income * 0.25)
}

function confidenceOf(a: Answers): { level: Confidence; why: string; must: number; extra: number } {
  const must = mustKeys().filter((k) => {
    const v = a[k]
    return v !== undefined && v !== null && v !== ''
  }).length
  const extraKeys: (keyof Answers)[] = [
    'yearsEarning',
    'incomeLow',
    'incomeHigh',
    'itrAnnual',
    'cardUtilisationPct',
    'bouncesLast12',
    'emergencyMonths',
    'collateralValue',
    'coApplicantIncome',
    'upcomingLargeExpense',
    'productiveMonthlyReturn',
    'offerRatePct',
    'rentMonthly',
    'highCostDebtOutstanding',
  ]
  const extra = extraKeys.filter((k) => a[k] !== undefined && a[k] !== null).length

  let score = must * 8 + extra * 5
  if (a.creditScoreKnown === false) score -= 8 // unknown widens, not zero
  if (a.incomeType === 'self_employed' && a.itrAnnual == null) score -= 6
  if (a.incomeType === 'informal') score -= 4

  let level: Confidence = 'low'
  if (score >= 85) level = 'high'
  else if (score >= 55) level = 'medium'

  const why =
    level === 'high'
      ? `Must set complete (${must}/8) and ${extra} tightening answers — bands are relatively narrow.`
      : level === 'medium'
        ? `Enough to decide, but ${8 - must} must-gaps or few extras keep ranges honest.`
        : `Sparse answers — showing wide ranges on purpose. More detail will tighten numbers.`

  return { level, why, must, extra }
}

export function assess(a: Answers): Assessment {
  const { product, why: productWhy } = recommendProduct(a)
  const { income, why: incomeWhy } = effectiveIncome(a)
  const { lender: lenderFoir, safe: safeFoir, why: foirWhy } = foirCaps(a, product)
  const { band, why: rateWhy } = fairRateBand(a, product)
  const feePct = processingFeePct(product)
  const tenure = defaultTenure(product)
  const existing = a.existingEmis ?? 0
  const wanted = a.amountWanted ?? 0
  const upcoming = a.upcomingLargeExpense ?? 0
  const productive = a.productiveMonthlyReturn ?? 0
  const flags: string[] = []

  const conf = confidenceOf(a)

  // Widen rate when confidence low / score unknown
  let rateLow = band.low
  let rateHigh = band.high
  if (a.creditScoreKnown === false) {
    rateLow = Math.max(8, rateLow - 0.5)
    rateHigh = rateHigh + 1.5
    flags.push('Credit score unknown — rate band widened, not assumed poor.')
  }
  if (conf.level === 'low') {
    rateHigh += 1
    flags.push('Low confidence — upper rate and amount bands kept wide.')
  }

  const rateMid = Math.round(((rateLow + rateHigh) / 2) * 10) / 10
  const floor = livingFloor(a, income)

  // Headroom for new EMI
  let lenderEmiCap = income * lenderFoir - existing
  let safeEmiCap = income * safeFoir - existing

  // Living-cost check: income - existing - newEmi - floor >= 0
  const livingEmiCap = income - existing - floor
  safeEmiCap = Math.min(safeEmiCap, livingEmiCap)
  lenderEmiCap = Math.min(lenderEmiCap, income - existing - income * 0.15)

  if (upcoming > income * 2) {
    safeEmiCap *= 0.85
    flags.push('Large upcoming expense — safe EMI cut 15%.')
  }
  if (productive > 0 && (product === 'business' || product === 'lap' || product === 'two_wheeler')) {
    // Productive return can support a bit more on borrower-safe side only if secured/business
    safeEmiCap += productive * 0.5
    flags.push(`Productive return ${inr(productive)}/mo counted at 50% toward safe EMI.`)
  }

  lenderEmiCap = Math.max(0, lenderEmiCap)
  safeEmiCap = Math.max(0, safeEmiCap)

  let lenderAmount = principalFromEmi(lenderEmiCap, rateMid, tenure)
  let safeAmount = principalFromEmi(safeEmiCap, rateHigh /* stress rate for safe */, tenure)

  // Collateral LTV caps
  if (product === 'lap' && (a.collateralValue ?? 0) > 0) {
    const ltv = 0.55
    const cap = (a.collateralValue ?? 0) * ltv
    lenderAmount = Math.min(lenderAmount, cap)
    safeAmount = Math.min(safeAmount, cap * 0.9)
    flags.push(`LAP LTV capped at ${pct(ltv * 100, 0)} of collateral.`)
  }
  if (product === 'gold' && (a.collateralValue ?? 0) > 0) {
    const ltv = 0.75
    const cap = (a.collateralValue ?? 0) * ltv
    lenderAmount = Math.min(lenderAmount, cap)
    safeAmount = Math.min(safeAmount, cap)
    flags.push(`Gold LTV capped at ${pct(ltv * 100, 0)}.`)
  }
  if (product === 'two_wheeler') {
    lenderAmount = Math.min(lenderAmount, 2_50_000)
    safeAmount = Math.min(safeAmount, 2_00_000)
  }

  // Age tenor trim
  if ((a.age ?? 30) + tenure / 12 > 60 && !isSecured(product)) {
    const shorter = Math.max(24, (60 - (a.age ?? 30)) * 12)
    lenderAmount = principalFromEmi(lenderEmiCap, rateMid, shorter)
    safeAmount = principalFromEmi(safeEmiCap, rateHigh, shorter)
    flags.push('Age limits unsecured tenor before 60.')
  }

  lenderAmount = roundTo(Math.max(0, lenderAmount), 10_000)
  safeAmount = roundTo(Math.max(0, safeAmount), 10_000)

  // Shrink safe principal until income−20% / rate+3pts stress still clears living floor
  const stressOk = (principal: number) => {
    if (principal <= 0) return true
    const stressIncome = income * 0.8
    const stressEmi = emiFor(principal, rateMid + 3, tenure)
    return (
      stressIncome > 0 &&
      stressEmi / stressIncome <= safeFoir + 0.05 &&
      stressIncome - existing - stressEmi >= floor * 0.85
    )
  }
  if (safeAmount > 0 && !stressOk(safeAmount)) {
    let lo = 0
    let hi = safeAmount
    while (hi - lo > 10_000) {
      const mid = roundTo((lo + hi) / 2, 10_000)
      if (stressOk(mid)) lo = mid
      else hi = mid - 10_000
    }
    safeAmount = lo
    flags.push('Safe amount trimmed so an income −20% / rate +3 pts month still clears living costs.')
  }

  // High-cost debt: strongly discourage stacking
  const highCost = a.highCostDebtOutstanding ?? 0
  const bounce = a.bouncesLast12 ?? 0

  let verdict: Verdict = 'borrow'
  let verdictWhy = ''

  const alreadyStressed = existing > income * safeFoir
  const noRoom = safeAmount < 25_000 && wanted > 0
  const stackingTrap =
    highCost > 0 && bounce > 0 && (product === 'personal' || product === 'business') && !isSecured(product)

  if (stackingTrap || (a.incomeType === 'informal' && bounce > 0 && highCost > 0 && product !== 'gold')) {
    verdict = 'dont_borrow'
    verdictWhy = stackingTrap
      ? `Don't take another unsecured loan. You already carry high-cost debt (${inr(highCost)}) and a recent bounce — fresh credit at 30%+ will dig deeper. Stabilise or refinance the expensive book first.`
      : `Don't borrow more right now. Informal income, a bounced EMI, and existing high-cost debt mean a new loan is likely to fail a stress month.`
  } else if (alreadyStressed || noRoom) {
    verdict = 'dont_borrow'
    verdictWhy = alreadyStressed
      ? `Don't. Existing EMIs ${inr(existing)} already exceed a safe ${pct(safeFoir * 100, 0)} of income ${inr(income)}. A lender may still pitch you — decline.`
      : `Don't. After living costs and current EMIs, safe new EMI headroom is near zero — you cannot carry ${inr(wanted)} without cutting essentials.`
  } else if (wanted > safeAmount * 1.05) {
    verdict = 'borrow_less'
    verdictWhy =
      wanted > lenderAmount
        ? `Borrow less. You want ${inr(wanted)} but a lender is unlikely to clear more than ~${inr(lenderAmount)} on this profile, and you should only carry ~${inr(safeAmount)}.`
        : `Borrow less. A lender might sanction up to ~${inr(lenderAmount)}, but you should only take ~${inr(safeAmount)} so EMI survives a bad quarter and stays inside safe FOIR.`
  } else if (wanted > lenderAmount) {
    verdict = 'borrow_less'
    verdictWhy = `Borrow less or change product. Wanted ${inr(wanted)} sits above likely sanction ~${inr(lenderAmount)}. Safe carry is ${inr(safeAmount)}.`
  } else {
    verdict = 'borrow'
    verdictWhy = `Borrow — wanted ${inr(wanted)} fits under your safe ceiling ${inr(safeAmount)} and inside likely sanction ${inr(lenderAmount)}. Still negotiate rate into ${pct(rateLow)}–${pct(rateHigh)}.`
  }

  // Recommend which amount number to use
  const recommend: 'lender' | 'safe' = 'safe'
  const whyRecommend = `Use the borrower-safe number (${inr(safeAmount)}), not the lender's max. Lenders optimise for sanction; you optimise for sleep.`

  const tenureOpts = tenureChoices(product).map((months) => {
    const principal = Math.min(wanted > 0 ? wanted : safeAmount, safeAmount || lenderAmount)
    const emi = emiFor(principal || safeAmount, rateMid, months)
    return {
      months,
      emi: roundTo(emi, 100),
      totalInterest: roundTo(totalInterest(principal || safeAmount, rateMid, months), 100),
    }
  })

  const agreePrincipal = Math.min(
    wanted > 0 ? wanted : safeAmount,
    safeAmount > 0 ? safeAmount : lenderAmount,
  )
  const emiAtWanted = wanted > 0 ? roundTo(emiFor(wanted, rateMid, tenure), 100) : null
  const emiCeiling = roundTo(safeEmiCap, 100)
  const emiAtCeiling = roundTo(emiFor(agreePrincipal, rateMid, tenure), 100)

  const stressIncome = income * 0.8
  const stressEmi = emiFor(agreePrincipal, rateMid + 3, tenure)
  const stressShare = stressIncome > 0 ? stressEmi / stressIncome : 1
  const stressPass = stressOk(agreePrincipal)

  const aprLow = approxApr(rateLow, feePct, tenure / 12)
  const aprHigh = approxApr(rateHigh, feePct, tenure / 12)

  const negotiationPoints: string[] = [
    `Fair contractual rate for a ${productLabel(product).toLowerCase()} on this profile: ${pct(rateLow)}–${pct(rateHigh)}.`,
    `All-in APR including ~${pct(feePct, 0)} processing fee: ~${pct(aprLow)}–${pct(aprHigh)}.`,
    `I will not commit EMI above ${inr(emiCeiling)}/month (safe FOIR ${pct(safeFoir * 100, 0)} on ${inr(income)}).`,
  ]
  if (product === 'lap') {
    negotiationPoints.push('Price this as LAP against property — not as an unsecured personal loan.')
  }
  if (a.offerRatePct != null && a.offerRatePct > rateHigh) {
    negotiationPoints.push(
      `Your existing offer at ${pct(a.offerRatePct)} sits above fair. Ask them to match ${pct(rateHigh)} or walk.`,
    )
  }
  if (a.creditScoreKnown && (a.creditScore ?? 0) >= 750) {
    negotiationPoints.push(`Bureau ${a.creditScore} is prime — ask for the bank's best slab, not the NBFC rack rate.`)
  }

  const walkAway =
    verdict === 'dont_borrow'
      ? 'Walk away from any new unsecured offer today. Fix the existing book first.'
      : `Walk away if EMI > ${inr(emiCeiling)} or rate > ${pct(rateHigh)} on this product.`

  return {
    recommendedProduct: product,
    productWhy,
    verdict,
    verdictWhy,
    amounts: {
      lenderLikely: lenderAmount,
      borrowerSafe: safeAmount,
      recommend,
      whyLender: `Likely sanction ~${inr(lenderAmount)} from EMI headroom at lender FOIR ${pct(lenderFoir * 100, 0)} (${foirWhy}). ${incomeWhy}`,
      whySafe: `Safe carry ~${inr(safeAmount)} from FOIR ${pct(safeFoir * 100, 0)} and living floor ${inr(floor)}, stressed at the top of the rate band.`,
      whyRecommend,
    },
    rate: { low: rateLow, high: rateHigh, mid: rateMid },
    rateWhy,
    apr: {
      low: Math.round(aprLow * 10) / 10,
      high: Math.round(aprHigh * 10) / 10,
      feePct,
      why: `RBI-style honesty: APR ≈ rate + processing fee (${pct(feePct, 0)}) spread over ${tenure / 12} years. Compare lender quotes on APR, not headline rate.`,
    },
    emi: {
      ceiling: emiCeiling,
      tenureMonths: tenure,
      emiAtCeiling,
      emiAtWanted,
      tenureOptions: tenureOpts,
      stress: {
        label: 'Income −20% or rate +3 pts',
        emiShareOfIncome: Math.round(stressShare * 1000) / 10,
        passes: stressPass,
        detail: stressPass
          ? `Stress EMI ~${inr(stressEmi)} stays survivable on ${inr(stressIncome)} income.`
          : `Stress EMI ~${inr(stressEmi)} on ${inr(stressIncome)} income breaks the safe FOIR / living floor — do not size to the lender's max.`,
      },
      why: `Monthly ceiling ${inr(emiCeiling)} is what remains inside safe FOIR after existing EMIs ${inr(existing)}. That is why it is not ${inr(Math.max(emiCeiling + 8000, lenderEmiCap))}.`,
    },
    confidence: conf.level,
    confidenceWhy: conf.why,
    answeredMust: conf.must,
    answeredExtra: conf.extra,
    negotiation: {
      headline:
        verdict === 'dont_borrow'
          ? 'Not borrowing today — and here is why I will say no in the branch'
          : `Fair for my profile: ${pct(rateLow)}–${pct(rateHigh)} on a ${productLabel(product)}`,
      fairBand: `${pct(rateLow)} – ${pct(rateHigh)} (APR ~${pct(aprLow)}–${pct(aprHigh)})`,
      talkingPoints: negotiationPoints,
      walkAway,
    },
    flags,
  }
}

/** Demo presets for the three brief personas */
export const PERSONAS: Record<string, Answers> = {
  priya: {
    purpose: 'Wedding expenses',
    amountWanted: 8_00_000,
    preferredProduct: 'personal',
    netMonthlyIncome: 1_10_000,
    incomeType: 'salaried',
    existingEmis: 14_000,
    householdExpenses: 35_000,
    rentMonthly: 28_000,
    age: 29,
    creditScoreKnown: true,
    creditScore: 780,
    yearsEarning: 5,
    bouncesLast12: 0,
    emergencyMonths: 3,
    cardUtilisationPct: 25,
  },
  ravi: {
    purpose: 'Second stock line and delivery vehicle for kirana',
    amountWanted: 15_00_000,
    preferredProduct: 'unsure',
    netMonthlyIncome: 60_000,
    incomeLow: 40_000,
    incomeHigh: 80_000,
    itrAnnual: 4_20_000,
    incomeType: 'self_employed',
    existingEmis: 0,
    householdExpenses: 35_000,
    age: 42,
    creditScoreKnown: false,
    yearsEarning: 14,
    collateralValue: 45_00_000,
    coApplicantIncome: 18_000,
    productiveMonthlyReturn: 12_000,
    emergencyMonths: 2,
    bouncesLast12: 0,
  },
  anita: {
    purpose: 'Electric scooter to double delivery runs',
    amountWanted: 1_50_000,
    preferredProduct: 'two_wheeler',
    netMonthlyIncome: 28_000,
    incomeLow: 26_000,
    incomeHigh: 30_000,
    incomeType: 'informal',
    existingEmis: 8_000,
    householdExpenses: 22_000,
    age: 35,
    creditScoreKnown: false,
    yearsEarning: 3,
    bouncesLast12: 1,
    highCostDebtOutstanding: 35_000,
    productiveMonthlyReturn: 8_000,
    emergencyMonths: 0,
  },
}
