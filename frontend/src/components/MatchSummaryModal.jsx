import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import GoalReplay from './GoalReplay'
import MatchEventFeed from './MatchEventFeed'
import { isGoalEvent, sortEvents } from '../utils/matchEvents'

export default function MatchSummaryModal({ match, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [replayEvent, setReplayEvent] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const goalQueueRef = useRef([])

  useEffect(() => {
    api.get(`/api/matches/${match.id}/events`)
      .then(r => setEvents(sortEvents(r.data.data || [])))
      .finally(() => setLoading(false))
  }, [match.id])

  const goals = events.filter(isGoalEvent)

  function startMatchReplay() {
    if (goals.length === 0) return
    goalQueueRef.current = [...goals]
    setReplaying(true)
    setReplayEvent(goalQueueRef.current.shift())
  }

  function handleReplayDone() {
    if (goalQueueRef.current.length > 0) {
      setReplayEvent(goalQueueRef.current.shift())
    } else {
      setReplayEvent(null)
      setReplaying(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="scroll-y modal-panel"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-summary-title"
      >
        <div className="label" style={{ marginBottom: 8 }}>Match Info</div>
        <div
          id="match-summary-title"
          style={{
          fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em',
          color: 'var(--cream)', marginBottom: 20,
        }}>
          {match.home_team_name} {match.home_goals}–{match.away_goals} {match.away_team_name}
        </div>

        {loading && <div className="spin" />}

        {!loading && goals.length > 0 && (
          <button
            type="button"
            onClick={startMatchReplay}
            disabled={replaying}
            className="btn-acid"
            style={{ width: '100%', marginBottom: replayEvent ? 16 : 20, justifyContent: 'center' }}
          >
            {replaying ? 'Replaying goals…' : `▶ Replay Match (${goals.length} goals)`}
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

        {!loading && events.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(237,232,220,0.3)', marginBottom: 20 }}>
            No recorded events for this match.
          </p>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className="label" style={{ marginBottom: 10 }}>Match Timeline</div>
            <MatchEventFeed events={events} match={match} />
          </>
        )}

        <button onClick={onClose} className="btn-outline" style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}>
          Close
        </button>
      </div>
    </div>
  )
}
