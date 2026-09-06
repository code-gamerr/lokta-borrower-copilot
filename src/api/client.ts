import type { Answers, Assessment } from '../engine'
import type { RiskResult } from './types'

export type AssessResponse = {
  assessment: Assessment
  ml: RiskResult
  meta: { openRouter: boolean; engine: string; mlModel: string }
}

export type ExplainResponse = { narrative: string; source: 'openrouter' | 'fallback' }
export type ChatResponse = { reply: string; source: 'openrouter' | 'fallback' }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

export function assessRemote(answers: Answers) {
  return api<AssessResponse>('/api/assess', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export function explainRemote(payload: {
  answers: Answers
  assessment: Assessment
  ml: RiskResult
}) {
  return api<ExplainResponse>('/api/explain', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function chatRemote(payload: {
  answers: Answers
  assessment: Assessment
  ml: RiskResult
  history: { role: 'user' | 'assistant'; content: string }[]
  message: string
}) {
  return api<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function healthRemote() {
  return api<{ ok: boolean; openRouter: boolean }>('/api/health')
}
