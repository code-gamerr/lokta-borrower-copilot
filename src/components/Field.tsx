import type { Question } from '../engine'
import type { Answers } from '../engine'

export function Field({
  q,
  value,
  onChange,
  labelledBy,
  describedBy,
}: {
  q: Question
  value: Answers[keyof Answers]
  onChange: (raw: string) => void
  labelledBy: string
  describedBy?: string
}) {
  if (q.type === 'boolean') {
    return (
      <div className="bool-row" role="group" aria-labelledby={labelledBy}>
        <button
          type="button"
          className={value === true ? 'on' : ''}
          aria-pressed={value === true}
          onClick={() => onChange('true')}
        >
          Yes
        </button>
        <button
          type="button"
          className={value === false ? 'on' : ''}
          aria-pressed={value === false}
          onClick={() => onChange('false')}
        >
          No / unknown
        </button>
      </div>
    )
  }
  if (q.type === 'select') {
    return (
      <select
        className="field"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Choose…
        </option>
        {q.options?.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      className="field"
      type={q.type === 'text' ? 'text' : 'number'}
      inputMode={q.type === 'text' ? 'text' : 'decimal'}
      placeholder={q.placeholder}
      min={q.min}
      max={q.max}
      step={q.step ?? (q.type === 'currency' ? 1000 : 1)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={value === undefined || value === null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
