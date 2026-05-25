import { useState, useEffect } from 'react'

function eventIcon(type) {
  if (type === 'goal') return '⚽'
  if (type === 'yellow_card') return '🟨'
  if (type === 'red_card') return '🟥'
  return '•'
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
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}>
      {/* Teams & Score */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-200 text-sm">{match.home_team_name}</span>
        <span
          className="text-xl font-bold px-3 py-1 rounded transition-transform duration-150"
          style={{
            color: '#2ec4b6',
            transform: scoreFlash ? 'scale(1.4)' : 'scale(1)',
            backgroundColor: scoreFlash ? '#1a3a38' : 'transparent',
          }}
        >
          {homeGoals} – {awayGoals}
        </span>
        <span className="font-semibold text-slate-200 text-sm">{match.away_team_name}</span>
      </div>

      {/* Minute bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#2d2d4e' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${(minute / 90) * 100}%`, backgroundColor: '#2ec4b6' }}
          />
        </div>
        <span className="text-xs font-mono" style={{ color: '#64748b' }}>{minute}'</span>
      </div>

      {/* Finished */}
      {finished && (
        <div className="text-center text-sm font-semibold" style={{ color: '#2ec4b6' }}>
          Full Time!
        </div>
      )}

      {/* Event feed */}
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {[...feed].reverse().map((e, i) => (
          <div key={i} className="text-xs flex items-center gap-2" style={{ color: '#94a3b8' }}>
            <span>{eventIcon(e.type)}</span>
            <span className="font-mono" style={{ color: '#64748b' }}>{e.minute}'</span>
            <span>{e.player_name}</span>
            <span style={{ color: '#475569' }}>— {e.team_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LiveMatchModal({ matches, onClose }) {
  const allFinished = matches.every(() => true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: '#2ec4b6' }}>Live Matches</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {matches.map(m => (
            <SingleMatch key={m.id} match={m} />
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-2 py-2 rounded-lg font-semibold text-sm transition-colors"
          style={{ backgroundColor: '#2ec4b6', color: '#0a0a0f' }}
        >
          Close & Refresh Standings
        </button>
      </div>
    </div>
  )
}
