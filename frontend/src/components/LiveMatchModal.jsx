import { useState, useEffect, useRef, useMemo } from 'react'
import GoalReplay from './GoalReplay'
import MatchEventFeed from './MatchEventFeed'
import { scoresFromEvent, isGoalEvent, formatMinute, maxEventMinute } from '../utils/matchEvents'

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

function useMatchSimulation(match) {
  const [minute, setMinute] = useState(0)
  const [feed, setFeed] = useState([])
  const [homeGoals, setHomeGoals] = useState(0)
  const [awayGoals, setAwayGoals] = useState(0)
  const [finished, setFinished] = useState(false)
  const [scoreFlash, setScoreFlash] = useState(false)
  const timerRef = useRef(null)
  const processedRef = useRef(new Set())

  const events = useMemo(() => dedupeEvents(match.events || []), [match.events])
  const endMinute = useMemo(() => maxEventMinute(events), [events])
  const goalEvents = useMemo(
    () => events.filter(isGoalEvent).sort((a, b) => a.minute - b.minute || a.type.localeCompare(b.type)),
    [events],
  )

  useEffect(() => {
    processedRef.current = new Set()
    setMinute(0)
    setFeed([])
    setHomeGoals(0)
    setAwayGoals(0)
    setFinished(false)

    timerRef.current = setInterval(() => {
      setMinute((prev) => (prev >= endMinute ? prev : prev + 1))
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [match.id, endMinute])

  useEffect(() => {
    if (minute <= 0 || minute > endMinute) return

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
  }, [minute, events, match, endMinute])

  useEffect(() => {
    if (minute >= endMinute) setFinished(true)
  }, [minute, endMinute])

  const displayHome = finished ? match.home_goals : homeGoals
  const displayAway = finished ? match.away_goals : awayGoals

  return {
    minute,
    feed,
    finished,
    scoreFlash,
    displayHome,
    displayAway,
    goalEvents,
    endMinute,
  }
}

function CompactScoreRow({ match, sim }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr auto',
      alignItems: 'center',
      gap: 10,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: sim.finished ? 'rgba(237,232,220,0.55)' : 'var(--cream)',
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {match.home_team_name}
      </span>

      <span style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        minWidth: 56,
        textAlign: 'center',
        color: sim.scoreFlash ? 'var(--acid)' : 'var(--cream)',
        transform: sim.scoreFlash ? 'scale(1.12)' : 'scale(1)',
        transition: 'color 0.2s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {sim.displayHome}<span style={{ color: 'rgba(237,232,220,0.15)', margin: '0 3px' }}>–</span>{sim.displayAway}
      </span>

      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: sim.finished ? 'rgba(237,232,220,0.55)' : 'var(--cream)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {match.away_team_name}
      </span>

      <span style={{
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 700,
        color: sim.finished ? 'var(--pink)' : 'var(--acid)',
        minWidth: 28,
        textAlign: 'right',
      }}>
        {sim.finished ? 'FT' : formatMinute(sim.minute)}
      </span>
    </div>
  )
}

function MatchDetail({ match, sim }) {
  const [replayEvent, setReplayEvent] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const goalQueueRef = useRef(null)

  function startMatchReplay() {
    if (sim.goalEvents.length === 0) return
    goalQueueRef.current = [...sim.goalEvents]
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

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 16, marginBottom: 16,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', textAlign: 'right' }}>
          {match.home_team_name}
        </span>
        <span style={{
          fontSize: 44, fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 1,
          color: sim.scoreFlash ? 'var(--acid)' : 'var(--cream)',
        }}>
          {sim.displayHome}<span style={{ color: 'rgba(237,232,220,0.15)', margin: '0 6px' }}>–</span>{sim.displayAway}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>
          {match.away_team_name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}>
          <div style={{
            height: 1,
            background: sim.finished ? 'var(--pink)' : 'var(--acid)',
            width: `${(sim.minute / sim.endMinute) * 100}%`,
            transition: 'width 0.05s linear, background 0.3s',
          }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
          color: sim.finished ? 'var(--pink)' : 'var(--acid)',
          minWidth: 28, textAlign: 'right',
        }}>
          {sim.finished ? 'FT' : formatMinute(sim.minute)}
        </span>
      </div>

      {sim.finished && sim.goalEvents.length > 0 && (
        <button
          type="button"
          onClick={startMatchReplay}
          disabled={replaying}
          className="btn-outline"
          style={{ width: '100%', marginBottom: replayEvent ? 12 : 14, justifyContent: 'center' }}
        >
          {replaying ? 'Replaying goals…' : `▶ Replay Match (${sim.goalEvents.length} goals)`}
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

      {sim.feed.length === 0 && !sim.finished && (
        <p style={{ fontSize: 11, color: 'rgba(237,232,220,0.3)', padding: '8px 0' }}>No events yet…</p>
      )}
      {sim.feed.length > 0 && (
        <MatchEventFeed
          events={sim.feed}
          match={match}
          reverse
          halftimeReached={sim.minute >= 45}
        />
      )}
    </div>
  )
}

function MatchSimSlot({ match, display, onFinished }) {
  const sim = useMatchSimulation(match)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (sim.finished && !finishedRef.current) {
      finishedRef.current = true
      onFinished()
    }
  }, [sim.finished, onFinished])

  if (display === 'compact') {
    return <CompactScoreRow match={match} sim={sim} />
  }
  if (display === 'detail') {
    return <MatchDetail match={match} sim={sim} />
  }
  return null
}

function MatchPager({ count, idx, onSelect }) {
  if (count <= 1) return null

  const goPrev = () => onSelect((idx - 1 + count) % count)
  const goNext = () => onSelect((idx + 1) % count)

  const arrowBtn = {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--cream)',
    fontSize: 20,
    lineHeight: 1,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    transition: 'border-color 0.15s, color 0.15s',
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}>
        <button type="button" aria-label="Previous match" onClick={goPrev} style={arrowBtn}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acid)'; e.currentTarget.style.color = 'var(--acid)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--cream)' }}
        >‹</button>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Match ${i + 1}`}
              title={`Match ${i + 1}`}
              style={{
                height: 3,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                width: i === idx ? 18 : 4,
                background: i === idx ? 'var(--acid)' : 'rgba(237,232,220,0.2)',
                transition: 'width 0.25s, background 0.25s',
              }}
            />
          ))}
        </div>

        <button type="button" aria-label="Next match" onClick={goNext} style={arrowBtn}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acid)'; e.currentTarget.style.color = 'var(--acid)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--cream)' }}
        >›</button>
      </div>
      <p style={{
        textAlign: 'center',
        marginTop: 10,
        fontSize: 10,
        color: 'rgba(237,232,220,0.35)',
        letterSpacing: '0.06em',
      }}>
        Use arrow keys or dots to switch matches
      </p>
    </div>
  )
}

const modalBtnStyle = { width: '100%', justifyContent: 'center' }

export default function LiveMatchModal({ matches, onClose }) {
  const [view, setView] = useState('live')
  const [detailIdx, setDetailIdx] = useState(0)
  const [finishedIds, setFinishedIds] = useState(() => new Set())

  const allFinished = matches.length > 0 && finishedIds.size >= matches.length

  function handleMatchFinished(matchId) {
    setFinishedIds((prev) => {
      if (prev.has(matchId)) return prev
      const next = new Set(prev)
      next.add(matchId)
      return next
    })
  }

  useEffect(() => {
    if (view !== 'detail' || matches.length <= 1) return
    function onKey(e) {
      if (e.key === 'ArrowLeft') setDetailIdx(i => (i - 1 + matches.length) % matches.length)
      if (e.key === 'ArrowRight') setDetailIdx(i => (i + 1) % matches.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, matches.length])

  const currentMatch = matches[detailIdx]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(24px)',
      padding: 24,
    }}>
      <div className="scroll-y" style={{
        width: '100%',
        maxWidth: view === 'detail' ? 640 : 520,
        maxHeight: '90vh',
        padding: view === 'detail' ? '40px 36px' : '36px 32px',
        background: 'var(--dark)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>
              {view === 'detail' ? 'Match Info' : 'Live Scores'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--cream)' }}>
              {allFinished ? 'Matchday Complete' : `${finishedIds.size} / ${matches.length} matches`}
            </div>
          </div>
          {!allFinished && (
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
          )}
        </div>

        {view === 'live' && <div className="label" style={{ marginBottom: 8 }}>Matches</div>}

        {view === 'detail' && currentMatch && (
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cream)', letterSpacing: '-0.01em' }}>
              {currentMatch.home_team_name} – {currentMatch.away_team_name}
            </div>
            <span style={{ fontSize: 10, color: 'rgba(237,232,220,0.35)', letterSpacing: '0.08em' }}>
              Match {detailIdx + 1} / {matches.length}
            </span>
          </div>
        )}

        <div style={{ marginBottom: view === 'detail' ? 0 : 24 }}>
          {matches.map((m, i) => (
            <MatchSimSlot
              key={m.id}
              match={m}
              display={
                view === 'live'
                  ? 'compact'
                  : i === detailIdx
                    ? 'detail'
                    : 'none'
              }
              onFinished={() => handleMatchFinished(m.id)}
            />
          ))}
        </div>

        {view === 'detail' && (
          <MatchPager count={matches.length} idx={detailIdx} onSelect={setDetailIdx} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
          {allFinished && view === 'live' && (
            <button type="button" onClick={() => setView('detail')} className="btn-acid" style={modalBtnStyle}>
              View Details
            </button>
          )}
          {view === 'detail' && (
            <button type="button" onClick={() => setView('live')} className="btn-outline" style={modalBtnStyle}>
              Back to Scores
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={allFinished && view === 'live' ? 'btn-outline' : 'btn-acid'}
            style={modalBtnStyle}
          >
            Close
          </button>
        </div>
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
