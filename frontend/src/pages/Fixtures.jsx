import { useState, useEffect } from 'react'
import api from '../api/axios'
import MatchCard from '../components/MatchCard'

export default function Fixtures() {
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(false)
  const [editMatch, setEditMatch] = useState(null)
  const [editHome, setEditHome] = useState('')
  const [editAway, setEditAway] = useState('')
  const [saving, setSaving] = useState(false)

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-200">Fixtures</h1>
        <select
          value={selectedId || ''}
          onChange={e => setSelectedId(Number(e.target.value))}
          className="text-sm rounded-lg px-3 py-2 outline-none"
          style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e', color: '#e2e8f0' }}
        >
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map(week => (
        <div key={week} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold" style={{ color: '#2ec4b6' }}>Week {week}</h2>
          {grouped[week].map(m => (
            <MatchCard key={m.id} match={m} onEdit={openEdit} />
          ))}
        </div>
      ))}

      {/* Edit modal */}
      {editMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 w-80 flex flex-col gap-4" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}>
            <h3 className="font-semibold text-slate-200">Edit Score</h3>
            <p className="text-sm text-slate-400">{editMatch.home_team_name} vs {editMatch.away_team_name}</p>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0"
                value={editHome}
                onChange={e => setEditHome(e.target.value)}
                className="w-16 text-center rounded-lg py-2 outline-none text-slate-200"
                style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}
              />
              <span className="text-slate-500">–</span>
              <input
                type="number" min="0"
                value={editAway}
                onChange={e => setEditAway(e.target.value)}
                className="w-16 text-center rounded-lg py-2 outline-none text-slate-200"
                style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#2ec4b6', color: '#0a0a0f' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditMatch(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
