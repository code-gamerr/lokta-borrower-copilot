import type { Answers, LoanProduct, RateBand } from './types'
import { isSecured } from './math'

/** Route borrower to a product before sizing. */
export function recommendProduct(a: Answers): { product: LoanProduct; why: string } {
  const purpose = (a.purpose ?? '').toLowerCase()
  const preferred = a.preferredProduct
  const hasCollateral = (a.collateralValue ?? 0) >= 5_00_000
  const wantsVehicle =
    purpose.includes('scooter') ||
    purpose.includes('bike') ||
    purpose.includes('two-wheeler') ||
    purpose.includes('two wheeler') ||
    purpose.includes('vehicle') ||
    preferred === 'two_wheeler'
  const wantsBusiness =
    purpose.includes('stock') ||
    purpose.includes('shop') ||
    purpose.includes('business') ||
    purpose.includes('inventory') ||
    purpose.includes('delivery') ||
    preferred === 'business' ||
    preferred === 'lap'
  const wantsWedding =
    purpose.includes('wedding') || purpose.includes('marriage') || purpose.includes('personal')

  if (preferred && preferred !== 'unsure') {
    if (preferred === 'business' && hasCollateral) {
      return {
        product: 'lap',
        why: 'You marked business need and have unencumbered property — a LAP usually prices 2–4 points cheaper than unsecured business credit.',
      }
    }
    if (preferred === 'personal' && wantsVehicle) {
      return {
        product: 'two_wheeler',
        why: 'Asset-backed two-wheeler credit is cheaper and easier to sanction than a clean personal loan for the same amount.',
      }
    }
    return {
      product: preferred,
      why: `Using your chosen product (${preferred.replace('_', ' ')}).`,
    }
  }

  if (wantsVehicle && (a.amountWanted ?? 0) <= 3_00_000) {
    return {
      product: 'two_wheeler',
      why: 'Purpose is a vehicle under ₹3L — two-wheeler finance fits better than an unsecured personal loan.',
    }
  }

  if (wantsBusiness && hasCollateral) {
    return {
      product: 'lap',
      why: 'Business expansion plus owned premises → LAP. Lenders underwrite the property; you should not pay unsecured personal-loan rates.',
    }
  }

  if (wantsBusiness && !hasCollateral) {
    return {
      product: 'business',
      why: 'Business purpose without pledging property → unsecured business loan. If you can offer gold or property later, revisit pricing.',
    }
  }

  if ((a.collateralValue ?? 0) > 0 && (a.collateralValue ?? 0) < 5_00_000 && wantsBusiness) {
    return {
      product: 'gold',
      why: 'Smaller pledgeable assets lean toward gold loan for speed; LAP needs clearer property title and higher ticket.',
    }
  }

  if (wantsWedding) {
    return {
      product: 'personal',
      why: 'Consumption / wedding purpose maps to a personal loan. No productive cashflow to underwrite.',
    }
  }

  return {
    product: 'personal',
    why: 'Defaulting to personal loan from the purpose described. Change product if you can pledge an asset.',
  }
}

/**
 * Fair contractual rate band by product + score quality.
 * Unknown score → wide band, never treated as 300.
 */
export function fairRateBand(a: Answers, product: LoanProduct): { band: RateBand; why: string } {
  const known = a.creditScoreKnown === true && typeof a.creditScore === 'number'
  const score = known ? a.creditScore! : null
  const bounce = a.bouncesLast12 ?? 0
  const util = a.cardUtilisationPct
  const years = a.yearsEarning ?? 0
  const informal = a.incomeType === 'informal'
  const selfEmp = a.incomeType === 'self_employed'

  let low: number
  let high: number
  let why: string

  const basePersonal = () => {
    if (score == null) {
      return { low: 13, high: 18, why: 'Credit score unknown — band stays wide (13–18%). Not modelled as a poor score.' }
    }
    if (score >= 780) return { low: 10.5, high: 12.5, why: `Score ${score} is prime — bank/NBFC personal loans often clear near 10.5–12.5%.` }
    if (score >= 750) return { low: 11, high: 13.5, why: `Score ${score} is strong — fair personal-loan quotes cluster around 11–13.5%.` }
    if (score >= 700) return { low: 12.5, high: 15, why: `Score ${score} is good — expect roughly 12.5–15% on unsecured.` }
    if (score >= 650) return { low: 15, high: 18, why: `Score ${score} is fair — unsecured pricing typically 15–18%.` }
    return { low: 18, high: 24, why: `Score ${score} is weak — many lenders decline; surviving offers often 18%+.` }
  }

  if (product === 'personal' || product === 'business') {
    const b = basePersonal()
    low = b.low
    high = b.high
    why = b.why
    if (product === 'business' && score == null) {
      low = 14
      high = 20
      why = 'Unsecured business credit with no bureau file — wide 14–20% until a lender scores cashflows.'
    }
  } else if (product === 'lap') {
    if (score == null) {
      low = 10.5
      high = 14
      why = 'LAP with thin/no bureau — property carries the deal; fair band ~10.5–14% depending on LTV and title.'
    } else if (score >= 750) {
      low = 9.5
      high = 11.5
      why = `LAP + score ${score} — secured pricing well below personal loans, ~9.5–11.5%.`
    } else if (score >= 700) {
      low = 10.5
      high = 12.5
      why = `LAP + score ${score} — expect roughly 10.5–12.5%.`
    } else {
      low = 11.5
      high = 14
      why = `LAP + score ${score} — still cheaper than unsecured, ~11.5–14%.`
    }
  } else if (product === 'gold') {
    low = 9
    high = 12
    why = 'Gold loans are asset-priced; bureau matters less. Typical 9–12% with LTV caps.'
  } else if (product === 'two_wheeler') {
    if (informal || score == null) {
      low = 14
      high = 20
      why = 'Two-wheeler finance for thin-file / informal income — dealer/NBFC quotes often 14–20%.'
    } else if (score >= 750) {
      low = 11
      high = 14
      why = `Two-wheeler + score ${score} — bank quotes can land near 11–14%.`
    } else {
      low = 13
      high = 17
      why = `Two-wheeler + score ${score} — fair band ~13–17%.`
    }
  } else {
    // home
    low = 8.5
    high = 10.5
    why = 'Home-loan prime band assumption ~8.5–10.5% (floating).'
  }

  // Adjustments that each "earn their place"
  if (bounce > 0) {
    low += 1.5
    high += 2.5
    why += ` Recent EMI bounce (+${bounce}) pushes pricing up and raises decline risk.`
  }
  if (typeof util === 'number' && util >= 70) {
    low += 0.5
    high += 1
    why += ` Card utilisation ${util}% signals leverage — lenders add ~0.5–1 pt.`
  }
  if (years >= 5 && !informal) {
    low -= 0.25
    high -= 0.25
    why += ` ${years}+ years earning stability nudges the band down slightly.`
  }
  if (selfEmp && score == null && !isSecured(product)) {
    high += 1
    why += ' Self-employed with no score: top of band stays open.'
  }
  if (informal && !isSecured(product)) {
    low += 1
    high += 2
    why += ' Informal income without security: lenders price a risk premium.'
  }
  if ((a.highCostDebtOutstanding ?? 0) > 0 && product === 'personal') {
    high += 1
    why += ' Existing high-cost app debt makes fresh unsecured credit look riskier.'
  }

  low = Math.round(low * 2) / 2
  high = Math.round(high * 2) / 2
  if (high < low + 1) high = low + 1.5

  return {
    band: { low, high, mid: Math.round(((low + high) / 2) * 10) / 10 },
    why,
  }
}

export function processingFeePct(product: LoanProduct): number {
  switch (product) {
    case 'gold':
      return 1
    case 'home':
    case 'lap':
      return 1
    case 'two_wheeler':
      return 2
    case 'business':
      return 2.5
    case 'personal':
    default:
      return 2
  }
}
