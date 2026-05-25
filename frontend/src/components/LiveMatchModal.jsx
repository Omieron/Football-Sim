import { useState, useEffect, useRef, useMemo } from 'react'
import GoalReplay from './GoalReplay'
import { eventIcon, eventDescription, scoresFromEvent, isGoalEvent } from '../utils/matchEvents'

function eventLabel(e, match) {
  return eventDescription(e, match)
}

function eventKey(e) {
  if (e.id != null && e.id > 0) return String(e.id)
  return `${e.minute}-${e.type}-${e.player_id ?? e.player_name}-${e.team_id}`
}

function dedupeEvents(list) {
  const seen = new Set()
  return list.filter((e) => {
    const key = eventKey(e)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function SingleMatch({ match }) {
  const [minute, setMinute] = useState(0)
  const [feed, setFeed] = useState([])
  const [homeGoals, setHomeGoals] = useState(0)
  const [awayGoals, setAwayGoals] = useState(0)
  const [finished, setFinished] = useState(false)
  const [scoreFlash, setScoreFlash] = useState(false)
  const [replayEvent, setReplayEvent] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const goalQueueRef = useRef(null)
  const timerRef = useRef(null)
  const processedRef = useRef(new Set())

  const events = useMemo(() => dedupeEvents(match.events || []), [match.events])
  const goalEvents = useMemo(
    () => events.filter(isGoalEvent).sort((a, b) => a.minute - b.minute || a.type.localeCompare(b.type)),
    [events],
  )

  function startMatchReplay() {
    if (goalEvents.length === 0) return
    goalQueueRef.current = [...goalEvents]
    setReplaying(true)
    setReplayEvent(goalQueueRef.current.shift())
  }

  function handleReplayDone() {
    if (goalQueueRef.current?.length > 0) {
      setReplayEvent(goalQueueRef.current.shift())
    } else {
      setReplayEvent(null)
      setReplaying(false)
    }
  }

  useEffect(() => {
    processedRef.current = new Set()
    setMinute(0)
    setFeed([])
    setHomeGoals(0)
    setAwayGoals(0)
    setFinished(false)

    timerRef.current = setInterval(() => {
      setMinute((prev) => (prev >= 90 ? prev : prev + 1))
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [match.id])

  useEffect(() => {
    if (minute <= 0 || minute > 90) return

    const minuteEvents = events.filter((e) => e.minute === minute)
    const fresh = minuteEvents.filter((e) => {
      const key = eventKey(e)
      if (processedRef.current.has(key)) return false
      processedRef.current.add(key)
      return true
    })

    if (fresh.length === 0) return

    setFeed((f) => [...f, ...fresh])
    fresh.forEach((e) => {
      const delta = scoresFromEvent(e, match)
      if (delta.home || delta.away) {
        if (delta.home) setHomeGoals((g) => g + 1)
        if (delta.away) setAwayGoals((g) => g + 1)
        setScoreFlash(true)
        setTimeout(() => setScoreFlash(false), 600)
      }
    })
  }, [minute, events, match])

  useEffect(() => {
    if (minute >= 90) setFinished(true)
  }, [minute])

  const displayHome = finished ? match.home_goals : homeGoals
  const displayAway = finished ? match.away_goals : awayGoals

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
          {displayHome}<span style={{ color: 'rgba(237,232,220,0.15)', margin: '0 6px' }}>–</span>{displayAway}
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

      {finished && goalEvents.length > 0 && (
        <button
          type="button"
          onClick={startMatchReplay}
          disabled={replaying}
          className="btn-outline"
          style={{ width: '100%', marginBottom: replayEvent ? 12 : 14 }}
        >
          {replaying ? 'Goller oynatılıyor…' : `▶ Maçı Tekrar Oynat (${goalEvents.length} gol)`}
        </button>
      )}

      {replayEvent && (
        <GoalReplay
          key={`${replayEvent.minute}-${replayEvent.player_name}-${replayEvent.type}`}
          event={replayEvent}
          match={match}
          onDone={handleReplayDone}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 120, overflowY: 'auto' }}>
        {[...feed].reverse().map((e, i) => {
          const { primary, secondary } = eventLabel(e, match)
          return (
            <div
              key={eventKey(e)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}
            >
              <span style={{ fontFamily: 'monospace', color: 'var(--acid)', minWidth: 26 }}>{e.minute}'</span>
              <span style={{ fontSize: 12 }}>{eventIcon(e.type)}</span>
              <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{primary}</span>
              <span style={{ color: 'rgba(237,232,220,0.3)' }}>— {secondary}</span>
            </div>
          )
        })}
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
        width: '100%', maxWidth: 640,
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
