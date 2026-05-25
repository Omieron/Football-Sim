import { useReveal } from '../hooks/useReveal'

const MIN_WEEKS = 4
const ACCENT = 'var(--acid)'

const emptyTextStyle = {
  fontSize: 11,
  color: 'rgba(237,232,220,0.3)',
  lineHeight: 1.6,
  padding: '8px 0',
}

export default function PredictionWidget({ predictions, currentWeek = 0 }) {
  const [ref, visible] = useReveal()
  const ready = currentWeek >= MIN_WEEKS && predictions?.length > 0
  const pending = currentWeek < MIN_WEEKS
  const weeksLeft = Math.max(0, MIN_WEEKS - currentWeek)

  const pendingText = weeksLeft === MIN_WEEKS
    ? `No odds yet. Play ${MIN_WEEKS} matchdays to see the title race.`
    : `No odds yet. A few matchdays must be played first — ${weeksLeft} to go.`

  return (
    <div ref={ref} className={`reveal ${visible ? 'in' : ''}`}>
      <div className="label" style={{ marginBottom: 14 }}>Championship Odds</div>

      {pending && (
        <p style={emptyTextStyle}>{pendingText}</p>
      )}

      {!pending && !ready && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <div className="spin" />
          <span style={{ fontSize: 11, color: 'rgba(237,232,220,0.35)' }}>Loading…</span>
        </div>
      )}

      {ready && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, paddingBottom: 4 }}>
          {[...predictions]
            .sort((a, b) => (b.percentage ?? b.championship_probability) - (a.percentage ?? a.championship_probability))
            .map((p, i) => {
              const pct = p.percentage ?? p.championship_probability ?? 0
              const isTop = i === 0
              return (
                <div key={p.team_id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontSize: isTop ? 13 : 11,
                      fontWeight: isTop ? 700 : 400,
                      letterSpacing: '-0.01em',
                      color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.5)',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{p.team_name}</span>
                    <span style={{
                      fontSize: isTop ? 20 : 13,
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      color: isTop ? ACCENT : 'rgba(237,232,220,0.3)',
                      lineHeight: 1,
                      flexShrink: 0,
                      marginLeft: 8,
                    }}>{pct.toFixed(1)}<span style={{ fontSize: isTop ? '0.55em' : '0.65em', fontWeight: 400 }}>%</span></span>
                  </div>
                  <div style={{ height: 1, background: 'var(--border)' }}>
                    <div style={{
                      height: 1,
                      width: `${pct}%`,
                      background: isTop ? ACCENT : 'rgba(237,232,220,0.12)',
                      transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border)', marginTop: 14 }}>
        <div style={{ height: 1, background: ACCENT, width: pending ? `${((currentWeek / MIN_WEEKS) * 100).toFixed(0)}%` : '100%' }} />
      </div>
    </div>
  )
}
