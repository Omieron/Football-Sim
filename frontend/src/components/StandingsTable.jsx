import { useReveal } from '../hooks/useReveal'

export default function StandingsTable({ standings }) {
  const [ref, visible] = useReveal()

  if (!standings || standings.length === 0) {
    return <p className="label" style={{ padding: '24px 0' }}>No standings yet.</p>
  }

  const total = standings.length

  return (
    <div ref={ref} className={`reveal ${visible ? 'in' : ''}`} style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 36px 36px 36px 36px 36px 36px 36px 52px',
        gap: 0,
        padding: '8px 12px',
        background: 'var(--cream)',
        color: 'var(--black)',
      }}>
        {['#','Club','P','W','D','L','GF','GA','GD','PTS'].map((h, i) => (
          <span key={h} style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textAlign: i > 1 ? 'center' : 'left',
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {standings.map((s, i) => {
        const rank = i + 1
        let accent = 'transparent'
        if (rank <= 4) accent = 'var(--acid)'
        else if (rank > total - 3) accent = 'var(--pink)'

        return (
          <div
            key={s.team_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 36px 36px 36px 36px 36px 36px 36px 52px',
              gap: 0,
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
              background: i % 2 === 0 ? 'transparent' : 'var(--dim)',
              position: 'relative',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(237,232,220,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--dim)'}
          >
            {/* Accent bar */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 2, background: accent,
            }} />

            <span style={{ fontSize: 12, color: 'rgba(237,232,220,0.3)', fontWeight: 300 }}>{rank}</span>

            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.crest_url
                ? <img src={s.crest_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                : <span style={{
                    width: 18, height: 18, background: 'var(--mid)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'rgba(237,232,220,0.4)',
                  }}>{s.team_name?.[0]}</span>
              }
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}>{s.team_name}</span>
            </span>

            {[s.played, s.won, s.drawn, s.lost, s.goals_for, s.goals_against].map((v, j) => (
              <span key={j} style={{
                fontSize: 12, textAlign: 'center',
                color: 'rgba(237,232,220,0.45)', fontWeight: 300,
              }}>{v}</span>
            ))}

            <span style={{
              fontSize: 12, textAlign: 'center',
              color: 'rgba(237,232,220,0.35)', fontWeight: 300,
            }}>{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</span>

            <span style={{
              fontSize: 14, textAlign: 'center', fontWeight: 700,
              color: rank === 1 ? 'var(--acid)' : 'var(--cream)',
              letterSpacing: '-0.02em',
            }}>{s.points}</span>
          </div>
        )
      })}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, padding: '10px 12px 0', marginTop: 2 }}>
        {[
          { color: 'var(--acid)', label: 'Champions League' },
          { color: 'var(--pink)', label: 'Relegation' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: color, display: 'block', flexShrink: 0 }} />
            <span className="label">{label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
