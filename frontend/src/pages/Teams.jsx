import { useState, useEffect } from 'react'
import api from '../api/axios'
import TeamCard from '../components/TeamCard'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [players, setPlayers] = useState([])
  const [form, setForm] = useState({ name: '', short_name: '', crest_url: '', attack: 75, defense: 75 })
  const [playerForm, setPlayerForm] = useState({ name: '', position: 'FWD' })
  const [loading, setLoading] = useState(false)

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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-200">Teams</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — team list + create form */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {teams.map(t => (
              <div key={t.id} className={`rounded-lg transition-all ${selected?.id === t.id ? 'ring-2' : ''}`} style={{ '--tw-ring-color': '#2ec4b6' }}>
                <TeamCard team={t} onClick={selectTeam} />
              </div>
            ))}
          </div>

          {/* Create team form */}
          <form onSubmit={createTeam} className="rounded-lg p-4 flex flex-col gap-3" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#2ec4b6' }}>Add Team</h3>
            <input
              required placeholder="Team name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
              style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}
            />
            <input
              placeholder="Short name (e.g. MCI)"
              value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
              style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}
            />
            <div>
              <label className="text-xs text-slate-400 block mb-1">Attack: {form.attack}</label>
              <input type="range" min="1" max="100" value={form.attack}
                onChange={e => setForm(f => ({ ...f, attack: e.target.value }))}
                className="w-full accent-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Defense: {form.defense}</label>
              <input type="range" min="1" max="100" value={form.defense}
                onChange={e => setForm(f => ({ ...f, defense: e.target.value }))}
                className="w-full accent-blue-400"
              />
            </div>
            <button type="submit" disabled={loading}
              className="py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#2ec4b6', color: '#0a0a0f' }}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        </div>

        {/* Right — team detail */}
        {selected ? (
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {selected.crest_url && <img src={selected.crest_url} alt="" className="w-12 h-12 object-contain" />}
              <h2 className="text-lg font-bold text-slate-200">{selected.name}</h2>
            </div>

            {/* Players grouped by position */}
            {POSITIONS.map(pos => (
              grouped[pos].length > 0 && (
                <div key={pos}>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>{pos}</h3>
                  <div className="flex flex-wrap gap-2">
                    {grouped[pos].map(p => (
                      <span key={p.id} className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}

            {/* Add player form */}
            <form onSubmit={addPlayer} className="rounded-lg p-4 flex flex-col gap-3" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#2ec4b6' }}>Add Player</h3>
              <div className="flex gap-2">
                <input
                  required placeholder="Player name"
                  value={playerForm.name} onChange={e => setPlayerForm(f => ({ ...f, name: e.target.value }))}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
                  style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}
                />
                <select
                  value={playerForm.position} onChange={e => setPlayerForm(f => ({ ...f, position: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
                  style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}
                >
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
                <button type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#2ec4b6', color: '#0a0a0f' }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center text-slate-500 text-sm">
            Select a team to view details
          </div>
        )}
      </div>
    </div>
  )
}
