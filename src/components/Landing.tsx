import { useEffect, useRef, useState } from 'react'

export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (reduce || !fine) return

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      root.style.setProperty('--mx', x.toFixed(3))
      root.style.setProperty('--my', y.toFixed(3))
    }
    const onLeave = () => {
      root.style.setProperty('--mx', '0')
      root.style.setProperty('--my', '0')
    }
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="landing" ref={rootRef} style={{ ['--mx' as string]: 0, ['--my' as string]: 0 }}>
      <div className="landing-grain" aria-hidden />

      <header className={`landing-nav landing-anim landing-anim-nav${scrolled ? ' is-scrolled' : ''}`}>
        <p className="landing-wordmark">
          Borrower <em>Copilot</em>
        </p>
        <nav className="landing-nav-links" aria-label="Landing">
          <a href="#how-it-works">How it works</a>
          <a href="#outputs">Outputs</a>
          <a className="landing-nav-cta" href="#cases">
            Personas
          </a>
        </nav>
      </header>

      <div className="landing-hero-wrap">
        <div className="landing-plane" aria-hidden>
          <div className="landing-stars" />
          <div className="landing-glow" />
          <div className="landing-silhouette" />
        </div>

        <section className="landing-hero" aria-labelledby="landing-brand">
          <div className="landing-hero-copy">
            <h1 id="landing-brand" className="landing-brand landing-anim landing-anim-1">
              <span className="landing-brand-accent">Know your number</span>
              <span className="landing-brand-rest">with Copilot</span>
            </h1>

            <p className="landing-badge landing-glass landing-anim landing-anim-2">
              Policy · ML · grounded AI
            </p>

            <p className="landing-support landing-anim landing-anim-3">
              An auditable borrower self-assessment that prices what you can safely carry — before the
              branch desk names a ticket. No login. No bureau. Nothing stored.
            </p>

            <div className="landing-cta landing-anim landing-anim-4">
              <button type="button" className="landing-cta-primary" onClick={onGetStarted}>
                Get started
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </section>

        <a className="landing-scroll-hint" href="#cases">
          <span className="landing-scroll-hint-line" aria-hidden />
          Scroll
        </a>
      </div>

      <div className="landing-body">
        <section className="landing-section landing-section-cases" id="cases" aria-labelledby="cases-title">
          <header className="landing-section-intro landing-reveal">
            <p className="landing-eyebrow">Personas</p>
            <h2 id="cases-title">See how it reads three India paths</h2>
            <p className="landing-section-lede">
              Same engine. Different FOIR, rate band, and stress — like case studies you can run live.
            </p>
          </header>
          <div className="landing-cases">
            <article className="landing-case landing-glass landing-reveal">
              <h3>Priya — salaried prime</h3>
              <p>Dual amounts, tight rate band, EMI ceiling. Safe number sits below lender-likely.</p>
            </article>
            <article className="landing-case landing-glass landing-reveal">
              <h3>Ravi — LAP routing</h3>
              <p>Score unknown stays unknown. Wider band, collateral route when purpose earns it.</p>
            </article>
            <article className="landing-case landing-glass landing-reveal">
              <h3>Anita — don’t borrow</h3>
              <p>“Don’t” is a real verdict. Elevated ML risk with readable feature contributions.</p>
            </article>
          </div>
        </section>

        <section className="landing-section" id="how-it-works" aria-labelledby="how-title">
          <header className="landing-section-intro landing-reveal">
            <p className="landing-eyebrow">How it works</p>
            <h2 id="how-title">Three layers. One borrower-facing answer.</h2>
            <p className="landing-section-lede">
              Policy decides the numbers. ML scores stress you can read. AI explains — never invents
              rupees or rates.
            </p>
          </header>
          <ol className="landing-flow">
            <li className="landing-glass landing-reveal">
              <strong>Tell us your situation</strong>
              <span>
                Purpose, income, EMIs, score if you know it. Adaptive — kirana and IT don’t see the
                same path.
              </span>
            </li>
            <li className="landing-glass landing-reveal">
              <strong>Policy + ML via API</strong>
              <span>FOIR ceilings, fair rate bands, stress trim. Risk score with feature contributions.</span>
            </li>
            <li className="landing-glass landing-reveal">
              <strong>Walk in with a card</strong>
              <span>Verdict, safe amount, fair APR, EMI ceiling — printable for the branch desk.</span>
            </li>
          </ol>
        </section>

        <section className="landing-section" id="outputs" aria-labelledby="outputs-title">
          <header className="landing-section-intro landing-reveal">
            <p className="landing-eyebrow">The four outputs</p>
            <h2 id="outputs-title">What good looks like in the room</h2>
            <p className="landing-section-lede">
              Every number has a why. Ranges stay wide when you leave answers blank.
            </p>
          </header>
          <div className="landing-feature-grid">
            <article className="landing-glass landing-reveal">
              <p className="landing-kicker">Context</p>
              <h3>Borrow / less / don’t</h3>
              <p>“Don’t” is a real outcome — not decoration.</p>
            </article>
            <article className="landing-glass landing-reveal">
              <p className="landing-kicker">Planning</p>
              <h3>Two amounts</h3>
              <p>Lender-likely sanction vs what you can safely carry. Use the safe one.</p>
            </article>
            <article className="landing-glass landing-reveal">
              <p className="landing-kicker">Extensible</p>
              <h3>Fair rate band</h3>
              <p>Contractual range plus all-in APR with processing fee.</p>
            </article>
            <article className="landing-glass landing-reveal">
              <p className="landing-kicker">Persistent</p>
              <h3>EMI ceiling</h3>
              <p>Monthly max, tenure trade-off, and an income/rate stress case.</p>
            </article>
            <article className="landing-glass landing-reveal">
              <p className="landing-kicker">Flexible</p>
              <h3>Explainable ML</h3>
              <p>Linear risk with contribution bars — not a black box score.</p>
            </article>
            <article className="landing-glass landing-reveal">
              <p className="landing-kicker">Grounded</p>
              <h3>AI briefing</h3>
              <p>OpenRouter narrative tied to JSON. No invented ticket numbers.</p>
            </article>
          </div>
        </section>

        <section className="landing-section landing-section-runtime" aria-labelledby="runtime-title">
          <div className="landing-runtime-copy landing-reveal">
            <p className="landing-eyebrow">Assessment runtime</p>
            <h2 id="runtime-title">Numbers from rules. Story from the model.</h2>
            <p className="landing-section-lede">
              Express API runs policy + linear risk, then grounds chat on that payload. Without an
              OpenRouter key, explain/chat fall back to deterministic text.
            </p>
            <ul className="landing-chips">
              <li>No login</li>
              <li>No bureau</li>
              <li>No PII stored</li>
              <li>Auditable FOIR</li>
            </ul>
          </div>
          <pre className="landing-terminal landing-glass landing-reveal" tabIndex={0}>
            <code>
              {`POST /api/assess
✔ FOIR ceiling applied
✔ Fair APR band 11.2–13.8%
✔ Safe amount < lender-likely
✔ ML risk 34 · contributions ready
✔ Negotiation card printable`}
            </code>
          </pre>
        </section>

        <section className="landing-section landing-section-trust landing-reveal" aria-labelledby="trust-title">
          <header className="landing-section-intro">
            <p className="landing-eyebrow">Honesty</p>
            <h2 id="trust-title">What we will not pretend</h2>
          </header>
          <ul className="landing-trust">
            <li>This is a self-assessment — not a bank offer or bureau pull.</li>
            <li>Unknown credit score is never modelled as 300.</li>
            <li>APR here is fee-aware and simplified; compare quotes on all-in cost.</li>
            <li>Nothing is stored after you close the tab.</li>
          </ul>
        </section>

        <section className="landing-section landing-section-end landing-reveal" aria-labelledby="end-title">
          <div className="landing-end-panel landing-glass">
            <h2 id="end-title" className="landing-end-title">
              Ready when you are
            </h2>
            <p className="landing-section-lede">
              A few minutes now beats three years of paying four points over fair.
            </p>
            <button type="button" className="landing-cta-primary" onClick={onGetStarted}>
              Get started
              <span aria-hidden>→</span>
            </button>
          </div>
        </section>

        <footer className="landing-footer">
          <p className="landing-footer-quote">“Policy first. Explain second. Never invent the rupee.”</p>
          <p>Borrower Copilot · Lokta build challenge</p>
        </footer>
      </div>
    </div>
  )
}

