import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import GoalReplay from './GoalReplay'

function isGoal(e) {
  return e.type === 'goal' || e.type === 'own_goal'
}

export default function MatchSummaryModal({ match, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [replayEvent, setReplayEvent] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const goalQueueRef = useRef([])

  useEffect(() => {
    api.get(`/api/matches/${match.id}/events`)
      .then(r => setEvents(r.data.data || []))
      .finally(() => setLoading(false))
  }, [match.id])

  const goals = events.filter(isGoal).sort((a, b) => a.minute - b.minute || a.type.localeCompare(b.type))

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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10,10,10,0.93)', backdropFilter: 'blur(12px)',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '32px 28px',
        background: 'var(--dark)',
        border: '1px solid var(--border)',
      }}>
        <div className="label" style={{ marginBottom: 8 }}>Maç Özeti</div>
        <div style={{
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
            style={{ width: '100%', marginBottom: replayEvent ? 16 : 20 }}
          >
            {replaying ? 'Goller oynatılıyor…' : `▶ Maçı Tekrar Oynat (${goals.length} gol)`}
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

        {!loading && goals.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(237,232,220,0.3)', marginBottom: 20 }}>Bu maçta gol yok.</p>
        )}

        {!loading && goals.length > 0 && (
          <>
            <div className="label" style={{ marginBottom: 10 }}>Goller</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {goals.map((e, i) => (
                <div
                  key={`${e.minute}-${e.player_name}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontFamily: 'monospace', color: 'var(--acid)', minWidth: 28 }}>{e.minute}'</span>
                  <span>⚽</span>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{e.player_name}</span>
                  {e.assist_player_name && (
                    <span style={{ color: 'rgba(237,232,220,0.35)', fontSize: 11 }}>
                      assist: {e.assist_player_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <button onClick={onClose} className="btn-outline" style={{ width: '100%', marginTop: 24 }}>
          Kapat
        </button>
      </div>
    </div>
  )
}
