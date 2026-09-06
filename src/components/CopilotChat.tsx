import { useState, type FormEvent } from 'react'
import type { Answers, Assessment } from '../engine'
import { chatRemote } from '../api/client'
import type { RiskResult } from '../api/types'

export function CopilotChat({
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
