/** Client-safe re-export of ML types (mirrors server). */
export interface RiskFeature {
  id: string
  label: string
  value: number
  weight: number
  contribution: number
}

export interface RiskResult {
  score: number
  label: 'low' | 'moderate' | 'elevated' | 'severe'
  summary: string
  features: RiskFeature[]
  model: string
}
