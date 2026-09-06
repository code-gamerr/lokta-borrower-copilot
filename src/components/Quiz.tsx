import { useMemo, useState } from 'react'
import type { Answers } from '../engine'
import { inr, isAnswered, parseField, visibleQuestions } from '../engine'
import { incomeTypeLabel } from '../lib/labels'
import { Field } from './Field'

export function Quiz({
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
