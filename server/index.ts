import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { assess, PERSONAS } from '../src/engine/assess'
import type { Answers } from '../src/engine/types'
import { scoreRisk } from './ml/riskScore'
import { copilotChat, explainAssessment } from './llm/narrate'
import { openRouterConfigured } from './llm/openrouter'

const app = express()
const PORT = Number(process.env.PORT || 8787)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'borrower-copilot-api',
    openRouter: openRouterConfigured(),
    engine: 'rules-v1',
    ml: 'borrower-risk-linear-v1',
  })
})

app.get('/api/personas', (_req, res) => {
  res.json({ personas: Object.keys(PERSONAS) })
})

app.get('/api/personas/:id', (req, res) => {
  const p = PERSONAS[req.params.id]
  if (!p) {
    res.status(404).json({ error: 'Unknown persona' })
    return
  }
  const assessment = assess(p)
  const ml = scoreRisk(p, assessment)
  res.json({ id: req.params.id, answers: p, assessment, ml })
})

app.post('/api/assess', (req, res) => {
  const answers = (req.body?.answers ?? {}) as Answers
  const assessment = assess(answers)
  const ml = scoreRisk(answers, assessment)
  res.json({
    assessment,
    ml,
    meta: {
      openRouter: openRouterConfigured(),
      engine: 'rules-v1',
      mlModel: ml.model,
    },
  })
})

app.post('/api/explain', async (req, res) => {
  try {
    const answers = (req.body?.answers ?? {}) as Answers
    const assessment = req.body?.assessment ?? assess(answers)
    const ml = req.body?.ml ?? scoreRisk(answers, assessment)
    const result = await explainAssessment({ answers, assessment, ml })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'explain failed' })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const answers = (req.body?.answers ?? {}) as Answers
    const assessment = req.body?.assessment ?? assess(answers)
    const ml = req.body?.ml ?? scoreRisk(answers, assessment)
    const message = String(req.body?.message ?? '').trim()
    if (!message) {
      res.status(400).json({ error: 'message required' })
      return
    }
    const history = Array.isArray(req.body?.history) ? req.body.history : []
    const result = await copilotChat({ answers, assessment, ml, history, message })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'chat failed' })
  }
})

app.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT}  openRouter=${openRouterConfigured()}`)
})
