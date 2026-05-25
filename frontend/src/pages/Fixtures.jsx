import { useState, useEffect } from 'react'
import api from '../api/axios'
import MatchCard from '../components/MatchCard'
import { useReveal } from '../hooks/useReveal'

export default function Fixtures() {
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(false)
  const [editMatch, setEditMatch] = useState(null)
  const [editHome, setEditHome] = useState('')
  const [editAway, setEditAway] = useState('')
  const [saving, setSaving] = useState(false)
  const [headerRef, headerVisible] = useReveal()

  useEffect(() => {
    api.get('/api/leagues').then(r => {
      const list = r.data.data || []
      setLeagues(list)
      if (list.length > 0) setSelectedId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    api.get(`/api/leagues/${selectedId}/fixtures`)
      .then(r => setFixtures(r.data.data || []))
      .finally(() => setLoading(false))
  }, [selectedId])

  const grouped = fixtures.reduce((acc, m) => {
    if (!acc[m.week]) acc[m.week] = []
    acc[m.week].push(m)
    return acc
  }, {})

  function openEdit(match) {
    setEditMatch(match)
    setEditHome(match.home_goals)
    setEditAway(match.away_goals)
  }

  async function saveEdit() {
    setSaving(true)
    await api.put(`/api/matches/${editMatch.id}`, {
      home_goals: Number(editHome),
      away_goals: Number(editAway),
    })
    setFixtures(prev => prev.map(m =>
      m.id === editMatch.id ? { ...m, home_goals: Number(editHome), away_goals: Number(editAway) } : m
    ))
    setEditMatch(null)
    setSaving(false)
  }

  return (
    <>
      {/* Page header */}
      <div ref={headerRef} className={`reveal ${headerVisible ? 'in' : ''}`} style={{ marginBottom: 56 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Season Schedule</div>
            <div style={{
              fontSize: 'clamp(40px,8vw,100px)', fontWeight: 700,
              letterSpacing: '-0.05em', lineHeight: 0.88, color: 'var(--cream)',
            }}>
              Fixtures
            </div>
          </div>

          {leagues.length > 0 && (
            <select
              value={selectedId || ''}
              onChange={e => setSelectedId(Number(e.target.value))}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--border)',
                color: 'var(--cream)', fontSize: 11, fontFamily: 'inherit',
                padding: '4px 0', outline: 'none', cursor: 'pointer', minWidth: 140,
              }}
            >
              {leagues.map(l => (
                <option key={l.id} value={l.id} style={{ background: 'var(--dark)' }}>{l.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0' }}>
          <div className="spin" />
          <span className="label">Loading…</span>
        </div>
      )}

      {/* Week sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map(week => {
          const weekPlayed = grouped[week].every(m => m.played)
          return (
            <div key={week}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: 12, marginBottom: 4,
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'rgba(237,232,220,0.25)',
                }}>
                  Matchday {week}
                </span>
                {weekPlayed && (
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'var(--pink)',
                    padding: '2px 6px', border: '1px solid var(--pink)',
                  }}>
                    Played
                  </span>
                )}
              </div>
              {grouped[week].map(m => (
                <MatchCard key={m.id} match={m} onEdit={openEdit} />
              ))}
            </div>
          )
        })}
      </div>

      {/* Edit score modal */}
      {editMatch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.93)', backdropFilter: 'blur(12px)',
          padding: 24,
        }}>
          <div style={{
            width: '100%', maxWidth: 360,
            padding: '36px 32px',
            background: 'var(--dark)',
            border: '1px solid var(--border)',
          }}>
            <div className="label" style={{ marginBottom: 6 }}>Edit Result</div>
            <div style={{
              fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em',
              color: 'var(--cream)', marginBottom: 32, lineHeight: 1.3,
            }}>
              {editMatch.home_team_name}
              <span style={{ color: 'rgba(237,232,220,0.2)', margin: '0 10px' }}>vs</span>
              {editMatch.away_team_name}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <input
                type="number" min="0"
                value={editHome}
                onChange={e => setEditHome(e.target.value)}
                style={{
                  width: 64, textAlign: 'center',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--cream)',
                  color: 'var(--cream)', fontSize: 28, fontWeight: 700,
                  fontFamily: 'inherit', outline: 'none', padding: '4px 0',
                  letterSpacing: '-0.04em',
                }}
              />
              <span style={{ color: 'rgba(237,232,220,0.2)', fontSize: 24 }}>–</span>
              <input
                type="number" min="0"
                value={editAway}
                onChange={e => setEditAway(e.target.value)}
                style={{
                  width: 64, textAlign: 'center',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--cream)',
                  color: 'var(--cream)', fontSize: 28, fontWeight: 700,
                  fontFamily: 'inherit', outline: 'none', padding: '4px 0',
                  letterSpacing: '-0.04em',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEdit} disabled={saving} className="btn-acid" style={{ flex: 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditMatch(null)} className="btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
