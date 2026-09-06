export function Metric({
  label,
  value,
  why,
  emphasis,
  tone,
}: {
  label: string
  value: string
  why: string
  emphasis?: boolean
  tone?: 'good' | 'bad'
}) {
  return (
    <div className={`metric glass-card ${emphasis ? 'emphasis' : ''} ${tone ? `tone-${tone}` : ''}`}>
      <p className="label">{label}</p>
      <p className={`value mono ${tone ? `tone-${tone}` : ''}`}>{value}</p>
      <p className="why">{why}</p>
    </div>
  )
}
