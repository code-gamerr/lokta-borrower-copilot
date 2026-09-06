import { assess, PERSONAS, inr, pct, productLabel } from '../src/engine/index.ts'

for (const [name, a] of Object.entries(PERSONAS)) {
  const r = assess(a)
  console.log('\n===' + name.toUpperCase() + '===')
  console.log('Product:', productLabel(r.recommendedProduct))
  console.log('Verdict:', r.verdict)
  console.log('Why:', r.verdictWhy)
  console.log('Lender:', inr(r.amounts.lenderLikely), '| Safe:', inr(r.amounts.borrowerSafe))
  console.log('Rate:', pct(r.rate.low) + '-' + pct(r.rate.high), '| APR', pct(r.apr.low) + '-' + pct(r.apr.high))
  console.log('EMI cap:', inr(r.emi.ceiling), '| Stress:', r.emi.stress.passes ? 'pass' : 'FAIL')
  console.log('Card:', r.negotiation.headline)
  console.log('Flags:', r.flags.join(' | '))
}
