import type { ReactNode } from 'react'

export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="landing">
      <div className="landing-plane" aria-hidden>
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
        <p className="landing-watermark">₹</p>
      </div>

      <header className="landing-nav">
        <p className="landing-wordmark">
          Borrower <em>Copilot</em>
        </p>
      </header>

      <section className="landing-hero" aria-labelledby="landing-brand">
        <h1 id="landing-brand" className="landing-brand">
          Borrower <em>Copilot</em>
        </h1>
        <p className="landing-headline">Know your number before the lender names theirs.</p>
        <p className="landing-support">
          Four clear answers and a negotiation card — from what you tell us. No login. No bureau.
          Nothing stored.
        </p>
        <div className="landing-cta">
          <button type="button" className="btn btn-lg" onClick={onGetStarted}>
            Get started
          </button>
        </div>
      </section>
    </div>
  )
}

export function GetStarted({
  onContinue,
  onBack,
  onPersona,
  children,
}: {
  onContinue: () => void
  onBack: () => void
  onPersona: (key: 'priya' | 'ravi' | 'anita') => void
  children?: ReactNode
}) {
  return (
    <div className="started">
      <header className="started-top">
        <button type="button" className="btn ghost" onClick={onBack}>
          Back
        </button>
        <p className="landing-wordmark compact">
          Borrower <em>Copilot</em>
        </p>
      </header>

      <section className="started-panel glass-card" aria-labelledby="started-title">
        <p className="eyebrow">Get started</p>
        <h1 id="started-title">What you walk away with</h1>
        <p className="lede">
          Answer a short, adaptive set of questions. The policy engine sizes the loan; ML scores
          stress; AI explains — without inventing numbers.
        </p>

        <ol className="started-steps">
          <li>
            <strong>Should you borrow?</strong>
            <span>Borrow, borrow less, or don’t — with a one-line why.</span>
          </li>
          <li>
            <strong>How much?</strong>
            <span>Lender-likely sanction vs what you can safely carry.</span>
          </li>
          <li>
            <strong>Fair rate + APR</strong>
            <span>A band, including processing fee — so quotes compare honestly.</span>
          </li>
          <li>
            <strong>EMI ceiling + card</strong>
            <span>Monthly max, stress case, and a printable negotiation sheet.</span>
          </li>
        </ol>

        <div className="started-privacy" role="note">
          <strong>Privacy.</strong> Runs on what you type. No account. No bureau pull. No data kept
          after you close the tab.
        </div>

        <div className="actions">
          <button type="button" className="btn btn-lg" onClick={onContinue}>
            Start self-assessment
          </button>
        </div>

        <p className="eyebrow" style={{ marginTop: '1.75rem' }}>
          Or open a challenge persona
        </p>
        <div className="persona-grid" role="group" aria-label="Challenge personas">
          {(
            [
              ['priya', 'Priya, 29', 'Bengaluru · salaried'],
              ['ravi', 'Ravi, 42', 'Mysuru · kirana'],
              ['anita', 'Anita, 35', 'Hubballi · informal'],
            ] as const
          ).map(([key, title, sub]) => (
            <button key={key} type="button" className="persona" onClick={() => onPersona(key)}>
              <strong>{title}</strong>
              <span>{sub}</span>
            </button>
          ))}
        </div>
        {children}
      </section>
    </div>
  )
}
