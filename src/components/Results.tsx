import type { Answers, Assessment } from '../engine'
import { inr, pct, productLabel } from '../engine'
import type { RiskResult } from '../api/types'
import { aiSourceLabel, verdictLabel } from '../lib/labels'
import { CopilotChat } from './CopilotChat'
import { Metric } from './Metric'

export function Results({
  answers,
  assessment: result,
  ml,
  narrative,
  narrativeSource,
  onRestart,
  onEdit,
}: {
  answers: Answers
  assessment: Assessment
  ml: RiskResult
  narrative: string | null
  narrativeSource: string | null
  onRestart: () => void
  onEdit: () => void
}) {
  return (
    <div className="results-layout">
      <div className="results-main">
        <header className="results-head glass-card panel">
          <div className="badges">
            <span className={`badge ${result.verdict}`}>{verdictLabel[result.verdict]}</span>
            <span className={`badge conf ${result.confidence}`}>Confidence {result.confidence}</span>
            <span className={`badge risk ${ml.label}`}>ML risk {ml.score}</span>
          </div>
          <h1 className="verdict-title">{verdictLabel[result.verdict]}</h1>
          <p>{result.verdictWhy}</p>
          <p className="help">
            Product: <strong>{productLabel(result.recommendedProduct)}</strong> — {result.productWhy}
          </p>
        </header>

        <div className="grid-2" aria-label="Assessment outputs">
          <Metric
            label="Lender likely sanctions"
            value={inr(result.amounts.lenderLikely)}
            why={result.amounts.whyLender}
          />
          <Metric
            label="You can safely carry"
            value={inr(result.amounts.borrowerSafe)}
            why={result.amounts.whySafe}
            emphasis
          />
          <Metric
            label="Fair rate band"
            value={`${pct(result.rate.low)} – ${pct(result.rate.high)}`}
            why={result.rateWhy}
          />
          <Metric
            label="All-in APR"
            value={`${pct(result.apr.low)} – ${pct(result.apr.high)}`}
            why={result.apr.why}
          />
          <Metric
            label="EMI ceiling"
            value={`${inr(result.emi.ceiling)}/mo`}
            why={result.emi.why}
            emphasis
          />
          <Metric
            label="Stress case"
            value={result.emi.stress.passes ? 'Passes' : 'Fails'}
            why={result.emi.stress.detail}
            tone={result.emi.stress.passes ? 'good' : 'bad'}
          />
        </div>

        <section className="section glass-card panel" aria-labelledby="tenure-heading">
          <h2 id="tenure-heading">Tenure trade-off</h2>
          <table className="tenures">
            <caption className="sr-only">
              EMI and total interest by tenure at about {pct(result.rate.mid)}
            </caption>
            <thead>
              <tr>
                <th scope="col">Tenure</th>
                <th scope="col">EMI</th>
                <th scope="col">Interest</th>
              </tr>
            </thead>
            <tbody>
              {result.emi.tenureOptions.map((t) => (
                <tr key={t.months}>
                  <td className="mono">{t.months} mo</td>
                  <td className="mono">{inr(t.emi)}</td>
                  <td className="mono">{inr(t.totalInterest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section glass-card panel" aria-labelledby="ai-heading">
          <h2 id="ai-heading">
            AI briefing
            {aiSourceLabel(narrativeSource) ? ` (${aiSourceLabel(narrativeSource)})` : ''}
          </h2>
          {narrative ? (
            <div className="narrative">
              {narrative.split(/\n\n+/).map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="help" role="status">
              Generating grounded narrative…
            </p>
          )}
        </section>

        <section className="section" aria-labelledby="card-heading">
          <h2 id="card-heading">Negotiation card</h2>
          <div className="card-sheet" id="negotiation-card">
            <p className="eyebrow">Borrower Copilot · Negotiation card</p>
            <h3>{result.negotiation.headline}</h3>
            <p className="band">{result.negotiation.fairBand}</p>
            <ol>
              {result.negotiation.talkingPoints.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p className="walk">
              <strong>Walk away if: </strong>
              {result.negotiation.walkAway}
            </p>
          </div>
          <div className="actions no-print">
            <button type="button" className="btn secondary" onClick={() => window.print()}>
              Print card
            </button>
            <button type="button" className="btn ghost" onClick={onEdit}>
              Edit answers
            </button>
            <button type="button" className="btn ghost" onClick={onRestart}>
              Start over
            </button>
          </div>
        </section>
      </div>

      <aside className="results-side" aria-label="Risk and copilot">
        <div className="panel glass-card">
          <h2>ML risk · {ml.model}</h2>
          <div className="risk-gauge">
            <div className={`risk-score ${ml.label}`} aria-label={`Risk score ${ml.score}`}>
              {ml.score}
            </div>
            <div>
              <strong className={`risk-label ${ml.label}`}>{ml.label}</strong>
              <p className="help">{ml.summary}</p>
            </div>
          </div>
          <ul className="contrib">
            {ml.features.slice(0, 6).map((f) => (
              <li key={f.id}>
                <div className="contrib-top">
                  <span>{f.label}</span>
                  <span className="mono">{f.contribution}</span>
                </div>
                <div
                  className="bar"
                  role="meter"
                  aria-valuenow={Math.round(f.contribution)}
                  aria-valuemin={0}
                  aria-valuemax={40}
                  aria-label={f.label}
                >
                  <i style={{ width: `${Math.min(100, f.contribution * 3)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="help">ML informs the UI — it does not override policy verdict.</p>
        </div>

        <CopilotChat answers={answers} assessment={result} ml={ml} />
      </aside>
    </div>
  )
}
