import { useEffect, useRef, useState } from 'react'
import type { Answers, Assessment } from './engine'
import { PERSONAS } from './engine'
import { assessRemote, explainRemote } from './api/client'
import type { RiskResult } from './api/types'
import { GetStarted } from './components/GetStarted'
import { Landing } from './components/Landing'
import { Quiz } from './components/Quiz'
import { Results } from './components/Results'

type Phase = 'landing' | 'start' | 'quiz' | 'results'
type AssessView = 'idle' | 'loading' | 'retry' | 'error' | 'success'

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
  const retryRef = useRef<HTMLButtonElement>(null)

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
