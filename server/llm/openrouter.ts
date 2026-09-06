const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export function openRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim())
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Borrower Copilot',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts?.temperature ?? 0.3,
      max_tokens: opts?.maxTokens ?? 700,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 400)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('OpenRouter returned empty content')
  return text
}
