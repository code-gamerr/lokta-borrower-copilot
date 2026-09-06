import { useEffect, useMemo, useState, type FormEvent } from 'react'
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

type Phase = 'home' | 'quiz' | 'results'

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
  const [phase, setPhase] = useState<Phase>('home')
  const [answers, setAnswers] = useState<Answers>({})
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [ml, setMl] = useState<RiskResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeSource, setNarrativeSource] = useState<string | null>(null)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [llmOn, setLlmOn] = useState(false)

  useEffect(() => {
    healthRemote()
      .then((h) => {
        setApiOk(true)
        setLlmOn(h.openRouter)
      })
      .catch(() => setApiOk(false))
  }, [])

  async function runAssess(next: Answers) {
    setLoading(true)
    setError(null)
    setNarrative(null)
    try {
      const res = await assessRemote(next)
      setAssessment(res.assessment)
      setMl(res.ml)
      setLlmOn(res.meta.openRouter)
      setPhase('results')
      explainRemote({ answers: next, assessment: res.assessment, ml: res.ml })
        .then((e) => {
          setNarrative(e.narrative)
          setNarrativeSource(e.source)
        })
        .catch(() => {
          /* non-blocking */
        })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assessment failed — is the API running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shell">
      <header className="chrome no-print">
        <div className="chrome-brand">
          <div className="mark" aria-hidden />
          <div>
            <p className="product">Borrower Copilot</p>
            <p className="sub">Policy engine · ML risk · AI brief</p>
          </div>
        </div>
        <div className="chrome-status">
          <span className={`pill ${apiOk ? 'ok' : apiOk === false ? 'bad' : ''}`}>
            API {apiOk === null ? '…' : apiOk ? 'online' : 'offline'}
          </span>
          <span className={`pill ${llmOn ? 'ok' : ''}`}>
            OpenRouter {llmOn ? 'on' : 'fallback'}
          </span>
        </div>
      </header>

      <main className="main">
        {error ? <div className="banner bad">{error}</div> : null}
        {loading ? <div className="banner">Running policy + ML…</div> : null}

        {phase === 'home' ? (
          <Home
            onStart={() => {
              setAnswers({})
              setAssessment(null)
              setMl(null)
              setPhase('quiz')
            }}
            onPersona={(key) => {
              const a = { ...PERSONAS[key] }
              setAnswers(a)
              void runAssess(a)
            }}
          />
        ) : null}

        {phase === 'quiz' ? (
          <Quiz
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => setPhase('home')}
            onDone={() => void runAssess(answers)}
          />
        ) : null}

        {phase === 'results' && assessment && ml ? (
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
              setPhase('home')
            }}
            onEdit={() => setPhase('quiz')}
          />
        ) : null}
      </main>
    </div>
  )
}

function Home({
  onStart,
  onPersona,
}: {
  onStart: () => void
  onPersona: (key: keyof typeof PERSONAS) => void
}) {
  return (
    <section className="hero-panel">
      <p className="eyebrow">Self-assessment · India · rupees</p>
      <h1>Walk into the lender knowing your number.</h1>
      <p className="lede">
        Deterministic policy for verdict, amount, rate, and EMI. An interpretable ML risk score on
        the side. OpenRouter writes the branch briefing — without inventing numbers.
      </p>

      <div className="feature-row">
        <div className="feature">
          <strong>Policy</strong>
          <span>Auditable FOIR / rate / verdict rules</span>
        </div>
        <div className="feature">
          <strong>ML</strong>
          <span>Linear risk with feature contributions</span>
        </div>
        <div className="feature">
          <strong>AI</strong>
          <span>Grounded explain + copilot chat</span>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn" onClick={onStart}>
          Start assessment
        </button>
      </div>

      <p className="eyebrow" style={{ marginTop: '2rem' }}>
        Challenge personas
      </p>
      <div className="persona-grid">
        {(
          [
            ['priya', 'Priya, 29', 'Bengaluru · salaried · wedding'],
            ['ravi', 'Ravi, 42', 'Mysuru · kirana · LAP path'],
            ['anita', 'Anita, 35', 'Hubballi · informal · stress'],
          ] as const
        ).map(([key, title, sub]) => (
          <button key={key} type="button" className="persona" onClick={() => onPersona(key)}>
            <strong>{title}</strong>
            <span>{sub}</span>
          </button>
        ))}
      </div>
    </section>
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
      <div className="quiz-main panel">
        <div className="step-meta">
          <span>
            {safeIdx + 1} / {questions.length}
          </span>
          <span className={`tier ${q.tier}`}>{q.tier === 'must' ? 'Must' : 'Tightens output'}</span>
        </div>
        <div className="progress">
          <i style={{ width: `${progress}%` }} />
        </div>
        <h2>{q.prompt}</h2>
        {q.help ? <p className="help">{q.help}</p> : null}
        {q.moves ? <p className="moves">Moves: {q.moves}</p> : null}
        <Field
          q={q}
          value={answers[q.id]}
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
      <aside className="quiz-side panel muted-panel">
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
              {answers.incomeType ? ` · ${incomeTypeLabel[answers.incomeType] ?? answers.incomeType}` : ''}
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
}: {
  q: Question
  value: Answers[keyof Answers]
  onChange: (raw: string) => void
}) {
  if (q.type === 'boolean') {
    return (
      <div className="bool-row">
        <button type="button" className={value === true ? 'on' : ''} onClick={() => onChange('true')}>
          Yes
        </button>
        <button
          type="button"
          className={value === false ? 'on' : ''}
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
        <header className="results-head">
          <div className="badges">
            <span className={`badge ${result.verdict}`}>{verdictLabel[result.verdict]}</span>
            <span className={`badge conf ${result.confidence}`}>Confidence {result.confidence}</span>
            <span className={`badge risk ${ml.label}`}>ML risk {ml.score}</span>
          </div>
          <h2>{verdictLabel[result.verdict]}</h2>
          <p>{result.verdictWhy}</p>
          <p className="help">
            Product: <strong>{productLabel(result.recommendedProduct)}</strong> — {result.productWhy}
          </p>
        </header>

        <div className="grid-2">
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
          />
        </div>

        <section className="section">
          <h3>Tenure trade-off</h3>
          <table className="tenures">
            <thead>
              <tr>
                <th>Tenure</th>
                <th>EMI</th>
                <th>Interest</th>
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

        <section className="section">
          <h3>
            AI briefing
            {aiSourceLabel(narrativeSource) ? ` (${aiSourceLabel(narrativeSource)})` : ''}
          </h3>
          {narrative ? (
            <div className="narrative">
              {narrative.split(/\n\n+/).map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="help">Generating grounded narrative…</p>
          )}
        </section>

        <section className="section">
          <h3>Negotiation card</h3>
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

      <aside className="results-side">
        <div className="panel">
          <h3>ML risk · {ml.model}</h3>
          <div className="risk-gauge">
            <div className={`risk-score ${ml.label}`}>{ml.score}</div>
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
                <div className="bar">
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
}: {
  label: string
  value: string
  why: string
  emphasis?: boolean
}) {
  return (
    <div className={`metric ${emphasis ? 'emphasis' : ''}`}>
      <p className="label">{label}</p>
      <p className="value mono">{value}</p>
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
    <div className="panel chat-panel no-print">
      <h3>Copilot chat</h3>
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
