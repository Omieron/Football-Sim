import { useState, useEffect } from 'react'
import api from '../api/axios'
import TeamCard from '../components/TeamCard'
import { useReveal } from '../hooks/useReveal'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [players, setPlayers] = useState([])
  const [form, setForm] = useState({ name: '', short_name: '', crest_url: '', attack: 75, defense: 75 })
  const [playerForm, setPlayerForm] = useState({ name: '', position: 'FWD' })
  const [loading, setLoading] = useState(false)
  const [headerRef, headerVisible] = useReveal()

  useEffect(() => {
    api.get('/api/teams').then(r => setTeams(r.data.data || []))
  }, [])

  function selectTeam(team) {
    setSelected(team)
    api.get(`/api/teams/${team.id}/players`).then(r => setPlayers(r.data.data || []))
  }

  async function createTeam(e) {
    e.preventDefault()
    setLoading(true)
    const r = await api.post('/api/teams', { ...form, attack: Number(form.attack), defense: Number(form.defense) })
    setTeams(prev => [...prev, r.data.data])
    setForm({ name: '', short_name: '', crest_url: '', attack: 75, defense: 75 })
    setLoading(false)
  }

  async function addPlayer(e) {
    e.preventDefault()
    const r = await api.post(`/api/teams/${selected.id}/players`, playerForm)
    setPlayers(prev => [...prev, r.data.data])
    setPlayerForm({ name: '', position: 'FWD' })
  }

  const grouped = POSITIONS.reduce((acc, pos) => {
    acc[pos] = players.filter(p => p.position === pos)
    return acc
  }, {})

  return (
    <>
      <style>{`
        .teams-layout { display: grid; grid-template-columns: 280px 1fr; gap: 56px; align-items: start; }
        @media (max-width: 880px) { .teams-layout { grid-template-columns: 1fr; gap: 40px; } }
      `}</style>

      {/* Page header */}
      <div ref={headerRef} className={`reveal ${headerVisible ? 'in' : ''}`} style={{ marginBottom: 56 }}>
        <div className="label" style={{ marginBottom: 10 }}>Club Directory</div>
        <div style={{
          fontSize: 'clamp(40px,8vw,100px)', fontWeight: 700,
          letterSpacing: '-0.05em', lineHeight: 0.88, color: 'var(--cream)',
        }}>
          Squads
        </div>
      </div>

      <div className="teams-layout">
        {/* Left: team list + create form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {teams.map(t => (
              <TeamCard key={t.id} team={t} onClick={selectTeam} selected={selected?.id === t.id} />
            ))}
            {teams.length === 0 && (
              <p className="label" style={{ padding: '24px 0' }}>No teams yet.</p>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28 }}>
            <div className="label" style={{ marginBottom: 20 }}>Add Team</div>
            <form onSubmit={createTeam} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <input
                required placeholder="Team name"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="editorial-input"
              />
              <input
                placeholder="Short name (e.g. MCI)"
                value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))}
                className="editorial-input"
              />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="label">Attack</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink)' }}>{form.attack}</span>
                </div>
                <input type="range" min="1" max="100" value={form.attack}
                  onChange={e => setForm(f => ({ ...f, attack: e.target.value }))}
                  style={{ width: '100%', accentColor: 'var(--pink)' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="label">Defense</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--acid)' }}>{form.defense}</span>
                </div>
                <input type="range" min="1" max="100" value={form.defense}
                  onChange={e => setForm(f => ({ ...f, defense: e.target.value }))}
                  style={{ width: '100%', accentColor: 'var(--acid)' }}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-acid">
                {loading ? 'Creating…' : 'Create Team'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: team detail */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {selected.crest_url ? (
                <img src={selected.crest_url} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              ) : (
                <div style={{
                  width: 56, height: 56, background: 'var(--mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: 'rgba(237,232,220,0.2)',
                }}>
                  {selected.name?.[0]}
                </div>
              )}
              <div>
                <div style={{
                  fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
                  lineHeight: 1, color: 'var(--cream)',
                }}>
                  {selected.name}
                </div>
                {selected.short_name && (
                  <div className="label" style={{ marginTop: 4 }}>{selected.short_name}</div>
                )}
              </div>
            </div>

            {/* Roster by position */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {POSITIONS.map(pos => grouped[pos].length > 0 && (
                <div key={pos}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: 'rgba(237,232,220,0.25)', marginBottom: 12,
                  }}>
                    {pos}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {grouped[pos].map(p => (
                      <span key={p.id} style={{
                        fontSize: 12, fontWeight: 500, padding: '4px 10px',
                        border: '1px solid var(--border)',
                        color: 'rgba(237,232,220,0.6)', letterSpacing: '-0.01em',
                      }}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add player */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <div className="label" style={{ marginBottom: 16 }}>Add Player</div>
              <form onSubmit={addPlayer} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <input
                  required placeholder="Player name"
                  value={playerForm.name} onChange={e => setPlayerForm(f => ({ ...f, name: e.target.value }))}
                  className="editorial-input"
                  style={{ flex: 1 }}
                />
                <select
                  value={playerForm.position} onChange={e => setPlayerForm(f => ({ ...f, position: e.target.value }))}
                  style={{
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--cream)', fontSize: 12, fontFamily: 'inherit',
                    padding: '4px 0', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {POSITIONS.map(p => <option key={p} style={{ background: 'var(--dark)' }}>{p}</option>)}
                </select>
                <button type="submit" className="btn-acid" style={{ flexShrink: 0 }}>Add</button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <p className="label">Select a team to view details</p>
          </div>
        )}
      </div>
    </>
  )
}
