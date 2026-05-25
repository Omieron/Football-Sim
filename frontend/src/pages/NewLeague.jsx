import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useReveal } from '../hooks/useReveal'

export default function NewLeague() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [name, setName] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [headerRef, headerVisible] = useReveal()

  useEffect(() => {
    api.get('/api/teams').then(r => setTeams(r.data.data || []))
  }, [])

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleGroup(groupTeams) {
    const ids = groupTeams.map(t => t.id)
    const allSelected = ids.every(id => selected.includes(id))
    if (allSelected) {
      setSelected(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelected(prev => [...new Set([...prev, ...ids])])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (selected.length < 4) { setError('Select at least 4 teams.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/api/leagues', { name, team_ids: selected })
      navigate('/')
    } catch {
      setError('Failed to create league.')
    } finally {
      setLoading(false)
    }
  }

  const grouped = teams.reduce((acc, t) => {
    const key = t.competition_name || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})
  const groupKeys = Object.keys(grouped).sort()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div ref={headerRef} className={`reveal ${headerVisible ? 'in' : ''}`} style={{ marginBottom: 56 }}>
        <div className="label" style={{ marginBottom: 10 }}>Setup</div>
        <div style={{
          fontSize: 'clamp(40px,8vw,100px)', fontWeight: 700,
          letterSpacing: '-0.05em', lineHeight: 0.88, color: 'var(--cream)',
        }}>
          New League
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* League name */}
        <div>
          <div className="label" style={{ marginBottom: 14 }}>League Name</div>
          <input
            required placeholder="e.g. Premier League Fantasy"
            value={name} onChange={e => setName(e.target.value)}
            className="editorial-input"
            style={{ fontSize: 20, width: '100%', letterSpacing: '-0.02em' }}
          />
        </div>

        {/* Team selector */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div className="label">Select Teams</div>
              <div style={{ fontSize: 11, marginTop: 3 }}>
                <span style={{ color: 'var(--acid)', fontWeight: 600 }}>{selected.length}</span>
                <span style={{ color: 'rgba(237,232,220,0.3)' }}> selected — min 4</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setSelected(teams.map(t => t.id))} className="btn-ghost">All</button>
              <button type="button" onClick={() => setSelected([])} className="btn-ghost">Clear</button>
            </div>
          </div>

          {teams.length === 0 ? (
            <div style={{ padding: '40px 0', borderTop: '1px solid var(--border)' }}>
              <p className="label" style={{ marginBottom: 16 }}>No teams in database</p>
              <Link to="/import" className="btn-acid">Import from ESPN</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {groupKeys.map(key => {
                const groupTeams = grouped[key]
                const selectedInGroup = groupTeams.filter(t => selected.includes(t.id)).length
                const allInGroup = selectedInGroup === groupTeams.length

                return (
                  <div key={key}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingBottom: 10, marginBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
                        textTransform: 'uppercase', color: 'rgba(237,232,220,0.4)',
                      }}>
                        {key}
                        <span style={{ color: 'rgba(237,232,220,0.2)', marginLeft: 8 }}>
                          {selectedInGroup}/{groupTeams.length}
                        </span>
                      </span>
                      <button type="button" onClick={() => toggleGroup(groupTeams)} className="btn-ghost">
                        {allInGroup ? 'Deselect' : 'Select all'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                      {groupTeams.map(t => {
                        const isSelected = selected.includes(t.id)
                        return (
                          <button
                            key={t.id} type="button"
                            onClick={() => toggle(t.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 14px', textAlign: 'left',
                              background: isSelected ? 'rgba(212,255,0,0.06)' : 'transparent',
                              border: `1px solid ${isSelected ? 'var(--acid)' : 'var(--border)'}`,
                              color: isSelected ? 'var(--acid)' : 'rgba(237,232,220,0.5)',
                              cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                            }}
                          >
                            {t.crest_url ? (
                              <img src={t.crest_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                            ) : (
                              <span style={{
                                width: 18, height: 18, background: 'var(--mid)', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, color: 'rgba(237,232,220,0.3)',
                              }}>{t.name?.[0]}</span>
                            )}
                            <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, flex: 1, letterSpacing: '-0.01em' }}>
                              {t.name}
                            </span>
                            {isSelected && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--acid)', flexShrink: 0 }}>✓</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: 'var(--pink)',
            borderLeft: '2px solid var(--pink)', paddingLeft: 12,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading || selected.length < 4}
          className="btn-acid"
          style={{
            opacity: selected.length < 4 ? 0.4 : 1,
            cursor: selected.length < 4 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating…' : `Create League — ${selected.length} teams`}
        </button>
      </form>
    </div>
  )
}
