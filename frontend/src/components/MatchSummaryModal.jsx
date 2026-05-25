import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import GoalReplay from './GoalReplay'
import {
  eventIcon,
  eventTypeLabel,
  eventDescription,
  isGoalEvent,
  sortEvents,
} from '../utils/matchEvents'

export default function MatchSummaryModal({ match, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [replayEvent, setReplayEvent] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const goalQueueRef = useRef([])

  function loadEvents() {
    return api.get(`/api/matches/${match.id}/events`)
      .then(r => setEvents(sortEvents(r.data.data || [])))
  }

  useEffect(() => {
    loadEvents().finally(() => setLoading(false))
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

  async function handleDelete(eventId) {
    if (!window.confirm('Bu olayı maç özetinden kaldırmak istiyor musun?')) return
    setDeletingId(eventId)
    try {
      await api.delete(`/api/matches/${match.id}/events/${eventId}`)
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } catch {
      window.alert('Olay silinemedi.')
    } finally {
      setDeletingId(null)
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
        width: '100%', maxWidth: 560,
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

        {!loading && events.length === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(237,232,220,0.3)', marginBottom: 20 }}>
            Bu maç için kayıtlı olay yok.
          </p>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className="label" style={{ marginBottom: 10 }}>Maç Akışı</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {events.map((e) => {
                const { primary, secondary } = eventDescription(e, match)
                return (
                  <div
                    key={e.id ?? `${e.minute}-${e.type}-${e.player_name}`}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 0', borderBottom: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', color: 'var(--acid)', minWidth: 28, flexShrink: 0 }}>
                      {e.minute}'
                    </span>
                    <span style={{ flexShrink: 0 }}>{eventIcon(e.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'rgba(237,232,220,0.45)', fontSize: 10, marginBottom: 2 }}>
                        {eventTypeLabel(e.type)}
                      </div>
                      <div style={{ color: 'var(--cream)', fontWeight: 600 }}>{primary}</div>
                      {secondary && (
                        <div style={{ color: 'rgba(237,232,220,0.35)', fontSize: 11, marginTop: 2 }}>
                          {secondary}
                        </div>
                      )}
                    </div>
                    {e.id > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        title="Olayı kaldır"
                        style={{
                          flexShrink: 0,
                          background: 'none',
                          border: '1px solid var(--border)',
                          color: 'rgba(237,232,220,0.35)',
                          cursor: deletingId === e.id ? 'wait' : 'pointer',
                          fontSize: 11,
                          padding: '4px 8px',
                          lineHeight: 1,
                        }}
                      >
                        {deletingId === e.id ? '…' : 'Sil'}
                      </button>
                    )}
                  </div>
                )
              })}
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
