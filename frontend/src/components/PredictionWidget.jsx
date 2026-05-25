import { useReveal } from '../hooks/useReveal'

export default function PredictionWidget({ predictions }) {
  const [ref, visible] = useReveal()

  if (!predictions || predictions.length === 0) return null

  const sorted = [...predictions].sort(
    (a, b) => (b.percentage ?? b.championship_probability) - (a.percentage ?? a.championship_probability)
  )

  return (
    <div ref={ref} className={`reveal ${visible ? 'in' : ''}`}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 20 }}>
        <span className="label">Championship Odds</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sorted.map((p, i) => {
          const pct = p.percentage ?? p.championship_probability ?? 0
          const isTop = i === 0
          return (
            <div key={p.team_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{
                  fontSize: isTop ? 15 : 13,
                  fontWeight: isTop ? 700 : 400,
                  letterSpacing: '-0.01em',
                  color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.55)',
                }}>{p.team_name}</span>
                <span style={{
                  fontSize: isTop ? 28 : 18,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: isTop ? 'var(--acid)' : 'rgba(237,232,220,0.35)',
                  lineHeight: 1,
                }}>{pct.toFixed(1)}<span style={{ fontSize: '0.5em', fontWeight: 300 }}>%</span></span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isTop ? 'var(--acid)' : 'rgba(237,232,220,0.18)',
                  transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
