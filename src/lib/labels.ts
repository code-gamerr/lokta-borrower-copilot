export const verdictLabel = {
  borrow: 'Borrow',
  borrow_less: 'Borrow less',
  dont_borrow: "Don't borrow",
} as const

export const incomeTypeLabel: Record<string, string> = {
  salaried: 'Salaried',
  self_employed: 'Self-employed / business',
  informal: 'Informal / gig / cash',
}

export function aiSourceLabel(source: string | null): string | null {
  if (!source) return null
  if (source === 'openrouter') return 'OpenRouter'
  if (source === 'fallback') return 'fallback'
  return source
}
