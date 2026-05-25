import { useState, useEffect } from 'react'

function eventIcon(type) {
  if (type === 'goal') return '⚽'
  if (type === 'yellow_card') return '🟨'
  if (type === 'red_card') return '🟥'
  return '·'
}

function SingleMatch({ match }) {
  const [minute, setMinute] = useState(0)
  const [feed, setFeed] = useState([])
  const [homeGoals, setHomeGoals] = useState(0)
  const [awayGoals, setAwayGoals] = useState(0)
  const [finished, setFinished] = useState(false)
  const [scoreFlash, setScoreFlash] = useState(false)

  const events = match.events || []

  useEffect(() => {
    const interval = setInterval(() => {
      setMinute(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          setFinished(true)
          return 90
        }
        const next = prev + 1
        const minuteEvents = events.filter(e => e.minute === next)
        if (minuteEvents.length > 0) {
          setFeed(f => [...f, ...minuteEvents])
          minuteEvents.forEach(e => {
            if (e.type === 'goal') {
              if (e.team_id === match.home_team_id) setHomeGoals(g => g + 1)
              else setAwayGoals(g => g + 1)
              setScoreFlash(true)
              setTimeout(() => setScoreFlash(false), 600)
            }
          })
        }
        return next
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 28, marginBottom: 28 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 16, marginBottom: 16,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
          color: 'var(--cream)', textAlign: 'right',
        }}>
          {match.home_team_name}
        </span>

        <span style={{
          fontSize: 40, fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 1,
          display: 'block', textAlign: 'center',
          color: scoreFlash ? 'var(--acid)' : 'var(--cream)',
          transform: scoreFlash ? 'scale(1.2)' : 'scale(1)',
          transition: 'color 0.2s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {homeGoals}<span style={{ color: 'rgba(237,232,220,0.15)', margin: '0 6px' }}>–</span>{awayGoals}
        </span>

        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--cream)' }}>
          {match.away_team_name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}>
          <div style={{
            height: 1,
            background: finished ? 'var(--pink)' : 'var(--acid)',
            width: `${(minute / 90) * 100}%`,
            transition: 'width 0.05s linear, background 0.3s',
          }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
          color: finished ? 'var(--pink)' : 'var(--acid)',
          minWidth: 28, textAlign: 'right',
        }}>
          {minute}'
        </span>
      </div>

      {finished && (
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 10,
        }}>
          Full Time
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 100, overflowY: 'auto' }}>
        {[...feed].reverse().map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--acid)', minWidth: 26 }}>{e.minute}'</span>
            <span style={{ fontSize: 12 }}>{eventIcon(e.type)}</span>
            <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{e.player_name}</span>
            <span style={{ color: 'rgba(237,232,220,0.3)' }}>— {e.team_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LiveMatchModal({ matches, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(24px)',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 600,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '44px 40px',
        background: 'var(--dark)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Live Simulation</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--cream)' }}>
              In Progress
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--pink)', boxShadow: '0 0 8px var(--pink)',
              animation: 'livePulse 1.4s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--pink)',
            }}>Live</span>
          </div>
        </div>

        {matches.map(m => <SingleMatch key={m.id} match={m} />)}

        <button onClick={onClose} className="btn-acid" style={{ width: '100%' }}>
          Close & Refresh
        </button>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.75); }
        }
      `}</style>
    </div>
  )
}
