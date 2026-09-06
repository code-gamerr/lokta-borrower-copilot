import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Answers, Assessment } from './engine'
import {
  PERSONAS,
  inr,
  isAnswered,
  parseField,
  pct,
  productLabel,
  visibleQuestions,
} from './engine'
import type { Question } from './engine'
import { assessRemote, chatRemote, explainRemote, healthRemote } from './api/client'
import type { RiskResult } from './api/types'
import { GetStarted, Landing } from './components/ui/borrower-flow/Landing'

type Phase = 'landing' | 'start' | 'quiz' | 'results'
type AssessView = 'idle' | 'loading' | 'retry' | 'error' | 'success'

const verdictLabel = {
  borrow: 'Borrow',
  borrow_less: 'Borrow less',
  dont_borrow: "Don't borrow",
} as const

const incomeTypeLabel: Record<string, string> = {
  salaried: 'Salaried',
  self_employed: 'Self-employed / business',
  informal: 'Informal / gig / cash',
}

function aiSourceLabel(source: string | null): string | null {
  if (!source) return null
  if (source === 'openrouter') return 'OpenRouter'
  if (source === 'fallback') return 'fallback'
  return source
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [answers, setAnswers] = useState<Answers>({})
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [ml, setMl] = useState<RiskResult | null>(null)
  const [view, setView] = useState<AssessView>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pendingAnswers, setPendingAnswers] = useState<Answers | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeSource, setNarrativeSource] = useState<string | null>(null)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [llmOn, setLlmOn] = useState(false)
  const retryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    healthRemote()
      .then((h) => {
        setApiOk(true)
        setLlmOn(h.openRouter)
      })
      .catch(() => setApiOk(false))
  }, [])

  useEffect(() => {
    if (view === 'error' && retryRef.current) retryRef.current.focus()
  }, [view])

  async function runAssess(next: Answers, mode: 'loading' | 'retry' = 'loading') {
    setPendingAnswers(next)
    setView(mode)
    setError(null)
    setNarrative(null)
    try {
      const res = await assessRemote(next)
      setAssessment(res.assessment)
      setMl(res.ml)
      setLlmOn(res.meta.openRouter)
      setAnswers(next)
      setPhase('results')
      setView('success')
      explainRemote({ answers: next, assessment: res.assessment, ml: res.ml })
        .then((e) => {
          setNarrative(e.narrative)
          setNarrativeSource(e.source)
        })
        .catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assessment failed — is the API running?')
      setView('error')
    }
  }

  function handleRetry() {
    if (!pendingAnswers) return
    setView('retry')
    window.setTimeout(() => {
      void runAssess(pendingAnswers, 'retry')
    }, 1000)
  }

  const busy = view === 'loading' || view === 'retry'
  const showChrome = phase !== 'landing'

  return (
    <div className={`shell ${phase === 'landing' ? 'shell-landing' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {showChrome ? (
        <header className="chrome no-print">
          <button
            type="button"
            className="chrome-brand linkish"
            onClick={() => {
              setView('idle')
              setPhase('landing')
            }}
          >
            <div className="mark" aria-hidden />
            <div>
              <p className="product">Borrower Copilot</p>
              <p className="sub">Policy · ML · AI</p>
            </div>
          </button>
          <div className="chrome-status" aria-label="System status">
            <span className={`pill ${apiOk ? 'ok' : apiOk === false ? 'bad' : ''}`}>
              API {apiOk === null ? '…' : apiOk ? 'online' : 'offline'}
            </span>
            <span className={`pill ${llmOn ? 'ok' : ''}`}>
              OpenRouter {llmOn ? 'on' : 'fallback'}
            </span>
          </div>
        </header>
      ) : null}

      <main
        id="main"
        className={`main ${phase === 'landing' ? 'main-landing' : ''}`}
        aria-busy={busy}
      >
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {view === 'loading' || view === 'retry'
            ? 'Running policy engine and ML risk model'
            : view === 'error'
              ? `Assessment error: ${error}`
              : view === 'success'
                ? 'Assessment ready'
                : ''}
        </div>

        {view === 'error' ? (
          <div className="state-card state-error glass-card" role="alert">
            <h2>Unable to run assessment</h2>
            <p>{error}</p>
            <button ref={retryRef} type="button" className="btn" onClick={handleRetry}>
              Retry connection
            </button>
          </div>
        ) : null}

        {busy ? (
          <div className="state-card glass-card" role="status" aria-label="Loading assessment">
            <div className="skeleton-line header-skeleton" />
            <div className="skeleton-line body-skeleton" />
            <div className="skeleton-grid">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
            <p className="help">
              {view === 'retry' ? 'Re-establishing connection…' : 'Running policy + ML…'}
            </p>
          </div>
        ) : null}

        {!busy && view !== 'error' && phase === 'landing' ? (
          <Landing onGetStarted={() => setPhase('start')} />
        ) : null}

        {!busy && view !== 'error' && phase === 'start' ? (
          <GetStarted
            onBack={() => setPhase('landing')}
            onContinue={() => {
              setAnswers({})
              setAssessment(null)
              setMl(null)
              setView('idle')
              setPhase('quiz')
            }}
            onPersona={(key) => void runAssess({ ...PERSONAS[key] })}
          />
        ) : null}

        {!busy && view !== 'error' && phase === 'quiz' ? (
          <Quiz
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => setPhase('start')}
            onDone={() => void runAssess(answers)}
          />
        ) : null}

        {!busy && view !== 'error' && phase === 'results' && assessment && ml ? (
          <Results
            answers={answers}
            assessment={assessment}
            ml={ml}
            narrative={narrative}
            narrativeSource={narrativeSource}
            onRestart={() => {
              setAnswers({})
              setAssessment(null)
              setMl(null)
              setNarrative(null)
              setView('idle')
              setPhase('landing')
            }}
            onEdit={() => {
              setView('idle')
              setPhase('quiz')
            }}
          />
        ) : null}
      </main>
    </div>
  )
}

function Quiz({
  answers,
  setAnswers,
  onDone,
  onBack,
}: {
  answers: Answers
  setAnswers: (a: Answers) => void
  onDone: () => void
  onBack: () => void
}) {
  const [includeExtra, setIncludeExtra] = useState(false)
  const [idx, setIdx] = useState(0)
  const questions = useMemo(
    () => visibleQuestions(answers, includeExtra),
    [answers, includeExtra],
  )
  const mustDone = useMemo(() => {
    const must = visibleQuestions(answers, false)
    return must.every((q) => isAnswered(q, answers))
  }, [answers])

  const safeIdx = Math.min(idx, Math.max(0, questions.length - 1))
  const q = questions[safeIdx]
  if (!q) return null

  const progress = ((safeIdx + 1) / questions.length) * 100
  const atMustEnd = !includeExtra && mustDone && safeIdx === questions.length - 1

  return (
    <div className="quiz-layout">
      <div className="quiz-main panel glass-card">
        <div className="step-meta">
          <span>
            Question {safeIdx + 1} of {questions.length}
          </span>
          <span className={`tier ${q.tier}`}>{q.tier === 'must' ? 'Must' : 'Tightens output'}</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Assessment progress"
        >
          <i style={{ width: `${progress}%` }} />
        </div>
        <h2 id={`q-${String(q.id)}`}>{q.prompt}</h2>
        {q.help ? (
          <p className="help" id={`help-${String(q.id)}`}>
            {q.help}
          </p>
        ) : null}
        {q.moves ? <p className="moves">Moves: {q.moves}</p> : null}
        <Field
          q={q}
          value={answers[q.id]}
          labelledBy={`q-${String(q.id)}`}
          describedBy={q.help ? `help-${String(q.id)}` : undefined}
          onChange={(raw) => setAnswers({ ...answers, [q.id]: parseField(q, raw) })}
        />
        <div className="nav-row">
          <button
            type="button"
            className="btn ghost"
            onClick={() => (safeIdx === 0 ? onBack() : setIdx(safeIdx - 1))}
          >
            Back
          </button>
          {!atMustEnd ? (
            <button
              type="button"
              className="btn"
              disabled={!isAnswered(q, answers)}
              onClick={() => {
                if (safeIdx >= questions.length - 1) onDone()
                else setIdx(safeIdx + 1)
              }}
            >
              {safeIdx >= questions.length - 1 ? 'Run assessment' : 'Next'}
            </button>
          ) : null}
        </div>
        {atMustEnd ? (
          <div className="gate">
            <p>Must set complete. Stop for wide bands, or tighten with extras that each move a number.</p>
            <div className="actions">
              <button type="button" className="btn secondary" onClick={onDone}>
                Run now
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIncludeExtra(true)
                  setIdx(questions.length)
                }}
              >
                Tighten numbers
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <aside className="quiz-side panel muted-panel glass-card" aria-label="Live capture">
        <h3>Live capture</h3>
        <dl className="kv">
          <div>
            <dt>Purpose</dt>
            <dd>{answers.purpose || '—'}</dd>
          </div>
          <div>
            <dt>Wanted</dt>
            <dd>{answers.amountWanted != null ? inr(answers.amountWanted) : '—'}</dd>
          </div>
          <div>
            <dt>Income</dt>
            <dd>
              {answers.netMonthlyIncome != null ? inr(answers.netMonthlyIncome) : '—'}
              {answers.incomeType
                ? ` · ${incomeTypeLabel[answers.incomeType] ?? answers.incomeType}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>Existing EMI</dt>
            <dd>{answers.existingEmis != null ? inr(answers.existingEmis) : '—'}</dd>
          </div>
        </dl>
        <p className="help">Nothing is stored. Assessment runs on the API when you finish.</p>
      </aside>
    </div>
  )
}

function Field({
  q,
  value,
  onChange,
  labelledBy,
  describedBy,
}: {
  q: Question
  value: Answers[keyof Answers]
  onChange: (raw: string) => void
  labelledBy: string
  describedBy?: string
}) {
  if (q.type === 'boolean') {
    return (
      <div className="bool-row" role="group" aria-labelledby={labelledBy}>
        <button
          type="button"
          className={value === true ? 'on' : ''}
          aria-pressed={value === true}
          onClick={() => onChange('true')}
        >
          Yes
        </button>
        <button
          type="button"
          className={value === false ? 'on' : ''}
          aria-pressed={value === false}
          onClick={() => onChange('false')}
        >
          No / unknown
        </button>
      </div>
    )
  }
  if (q.type === 'select') {
    return (
      <select
        className="field"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Choose…
        </option>
        {q.options?.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      className="field"
      type={q.type === 'text' ? 'text' : 'number'}
      inputMode={q.type === 'text' ? 'text' : 'decimal'}
      placeholder={q.placeholder}
      min={q.min}
      max={q.max}
      step={q.step ?? (q.type === 'currency' ? 1000 : 1)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={value === undefined || value === null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Results({
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

function Metric({
  label,
  value,
  why,
  emphasis,
  tone,
}: {
  label: string
  value: string
  why: string
  emphasis?: boolean
  tone?: 'good' | 'bad'
}) {
  return (
    <div className={`metric glass-card ${emphasis ? 'emphasis' : ''} ${tone ? `tone-${tone}` : ''}`}>
      <p className="label">{label}</p>
      <p className={`value mono ${tone ? `tone-${tone}` : ''}`}>{value}</p>
      <p className="why">{why}</p>
    </div>
  )
}

function CopilotChat({
  answers,
  assessment,
  ml,
}: {
  answers: Answers
  assessment: Assessment
  ml: RiskResult
}) {
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(e: FormEvent) {
    e.preventDefault()
    const text = message.trim()
    if (!text || busy) return
    setMessage('')
    const nextHist = [...history, { role: 'user' as const, content: text }]
    setHistory(nextHist)
    setBusy(true)
    try {
      const res = await chatRemote({
        answers,
        assessment,
        ml,
        history,
        message: text,
      })
      setHistory([...nextHist, { role: 'assistant', content: res.reply }])
    } catch (err) {
      setHistory([
        ...nextHist,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Chat failed',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel chat-panel glass-card no-print">
      <h2>Copilot chat</h2>
      <p className="help">Ask about rate, EMI, or why the verdict. Answers stay grounded in the JSON.</p>
      <div className="chat-log" role="log" aria-live="polite">
        {history.length === 0 ? (
          <p className="help">Try: “Why is safe lower than the lender number?”</p>
        ) : (
          history.map((m, i) => (
            <div key={`${m.role}-${i}`} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))
        )}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          className="field"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask the copilot…"
          aria-label="Message to copilot"
        />
        <button type="submit" className="btn" disabled={busy || !message.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
