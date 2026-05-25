import { useState } from 'react'

export default function MatchCard({ match, onSummary }) {
  const { home_team_name, away_team_name, home_crest_url, away_crest_url, home_goals, away_goals, played } = match
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
        background: hovered ? 'var(--dim)' : 'transparent',
        paddingLeft: hovered ? 8 : 0,
        paddingRight: hovered ? 8 : 0,
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Home */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <span style={{
            fontSize: 13, fontWeight: played ? 500 : 300,
            color: played ? 'var(--cream)' : 'rgba(237,232,220,0.5)',
            textAlign: 'right', letterSpacing: '-0.01em',
          }}>{home_team_name}</span>
          {home_crest_url
            ? <img src={home_crest_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
            : <span style={{ width: 20, height: 20, background: 'var(--mid)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgba(237,232,220,0.3)' }}>{home_team_name?.[0]}</span>
          }
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          {played ? (
            <span style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em',
              color: 'var(--cream)', lineHeight: 1,
            }}>
              {home_goals}<span style={{ color: 'rgba(237,232,220,0.2)', margin: '0 3px' }}>–</span>{away_goals}
            </span>
          ) : (
            <span className="label">vs</span>
          )}
        </div>

        {/* Away */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {away_crest_url
            ? <img src={away_crest_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
            : <span style={{ width: 20, height: 20, background: 'var(--mid)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgba(237,232,220,0.3)' }}>{away_team_name?.[0]}</span>
          }
          <span style={{
            fontSize: 13, fontWeight: played ? 500 : 300,
            color: played ? 'var(--cream)' : 'rgba(237,232,220,0.5)',
            letterSpacing: '-0.01em',
          }}>{away_team_name}</span>
        </div>
      </div>

      {played && onSummary && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <button
            type="button"
            onClick={() => onSummary(match)}
            className="btn-outline"
            style={{ justifyContent: 'center', padding: '8px 20px', fontSize: 10 }}
          >
            Match Info
          </button>
        </div>
      )}
    </div>
  )
}
