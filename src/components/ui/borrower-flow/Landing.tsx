export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="landing">
      <div className="landing-hero-wrap">
        <div className="landing-plane" aria-hidden>
          <div className="landing-orb landing-orb-a" />
          <div className="landing-orb landing-orb-b" />
          <p className="landing-watermark">₹</p>
        </div>

        <header className="landing-nav">
          <p className="landing-wordmark">
            Borrower <em>Copilot</em>
          </p>
          <button type="button" className="landing-nav-cta" onClick={onGetStarted}>
            Get started
          </button>
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
            <a className="landing-scroll" href="#how-it-works">
              See how it works
            </a>
          </div>
        </section>
      </div>

      <div className="landing-body">
        <section className="landing-section" id="how-it-works" aria-labelledby="how-title">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">Three layers. One borrower-facing answer.</h2>
          <p className="landing-section-lede">
            Policy decides the numbers. ML scores stress you can read. AI explains — never invents
            rupees or rates.
          </p>
          <ol className="landing-flow">
            <li>
              <strong>Tell us your situation</strong>
              <span>Purpose, income, EMIs, score if you know it. Adaptive — kirana and IT don’t see the same path.</span>
            </li>
            <li>
              <strong>Policy + ML run locally via API</strong>
              <span>FOIR ceilings, fair rate bands, stress trim. Risk score with feature contributions.</span>
            </li>
            <li>
              <strong>Walk in with a card</strong>
              <span>Verdict, safe amount, fair APR, EMI ceiling — printable for the branch desk.</span>
            </li>
          </ol>
        </section>

        <section className="landing-section" aria-labelledby="outputs-title">
          <p className="eyebrow">The four outputs</p>
          <h2 id="outputs-title">What “good” looks like in the room</h2>
          <p className="landing-section-lede">
            Every number has a why. Ranges stay wide when you leave answers blank.
          </p>
          <div className="landing-outputs">
            <article>
              <p className="landing-kicker">O1</p>
              <h3>Borrow / less / don’t</h3>
              <p>“Don’t” is a real outcome — not decoration.</p>
            </article>
            <article>
              <p className="landing-kicker">O2</p>
              <h3>Two amounts</h3>
              <p>Lender-likely sanction vs what you can safely carry. Use the safe one.</p>
            </article>
            <article>
              <p className="landing-kicker">O3</p>
              <h3>Fair rate band</h3>
              <p>Contractual range plus all-in APR with processing fee.</p>
            </article>
            <article>
              <p className="landing-kicker">O4</p>
              <h3>EMI ceiling</h3>
              <p>Monthly max, tenure trade-off, and an income/rate stress case.</p>
            </article>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="who-title">
          <p className="eyebrow">Built for India</p>
          <h2 id="who-title">Salaried, shop-floor, or gig — same tool, different path</h2>
          <p className="landing-section-lede">
            FOIR-style affordability, RBI-style fee honesty, products that match purpose: personal,
            LAP, gold, two-wheeler, business.
          </p>
          <ul className="landing-who">
            <li>
              <strong>Salaried</strong>
              <span>Net take-home, existing EMIs, rent — prime scores get a tight rate band.</span>
            </li>
            <li>
              <strong>Self-employed</strong>
              <span>ITR-anchored income, cash haircuts, collateral routes to LAP when it earns the place.</span>
            </li>
            <li>
              <strong>Informal / gig</strong>
              <span>Unknown score stays unknown. High-cost debt + bounce can correctly say don’t.</span>
            </li>
          </ul>
        </section>

        <section className="landing-section landing-section-trust" aria-labelledby="trust-title">
          <p className="eyebrow">Honesty</p>
          <h2 id="trust-title">What we will not pretend</h2>
          <ul className="landing-trust">
            <li>This is a self-assessment — not a bank offer or bureau pull.</li>
            <li>Unknown credit score is never modelled as 300.</li>
            <li>APR here is fee-aware and simplified; compare quotes on all-in cost.</li>
            <li>Nothing is stored after you close the tab.</li>
          </ul>
        </section>

        <section className="landing-section landing-section-end" aria-labelledby="end-title">
          <h2 id="end-title">Ready when you are</h2>
          <p className="landing-section-lede">
            A few minutes now beats three years of paying four points over fair.
          </p>
          <button type="button" className="btn btn-lg" onClick={onGetStarted}>
            Get started
          </button>
        </section>

        <footer className="landing-footer">
          <p>Borrower Copilot · Lokta build challenge</p>
        </footer>
      </div>
    </div>
  )
}

export { GetStarted } from './GetStarted'
