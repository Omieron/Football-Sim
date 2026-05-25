import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function NewLeague() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [name, setName] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  // Group teams by real-world competition
  const grouped = teams.reduce((acc, t) => {
    const key = t.competition_name || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort()

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-200">New League</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <input
          required placeholder="League name"
          value={name} onChange={e => setName(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
          style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Select teams{' '}
              <span style={{ color: '#64748b' }}>({selected.length} selected, min 4)</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(teams.map(t => t.id))}
                className="text-xs px-3 py-1 rounded"
                style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-xs px-3 py-1 rounded"
                style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
              >
                Clear
              </button>
            </div>
          </div>

          {teams.length === 0 && (
            <p className="text-sm" style={{ color: '#475569' }}>
              No teams yet.{' '}
              <a href="/import" className="underline" style={{ color: '#2ec4b6' }}>Import from ESPN</a>
              {' '}first.
            </p>
          )}

          {/* Grouped by source league */}
          {groupKeys.map(key => {
            const groupTeams = grouped[key]
            const selectedInGroup = groupTeams.filter(t => selected.includes(t.id)).length
            const allInGroup = selectedInGroup === groupTeams.length

            return (
              <div key={key} className="flex flex-col gap-2">
                {/* Group header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2ec4b6' }}>
                    {key}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupTeams)}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#2d2d4e', color: '#64748b' }}
                  >
                    {allInGroup ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* Teams in group */}
                <div className="grid grid-cols-2 gap-2">
                  {groupTeams.map(t => {
                    const isSelected = selected.includes(t.id)
                    return (
                      <button
                        key={t.id} type="button"
                        onClick={() => toggle(t.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                        style={{
                          backgroundColor: isSelected ? '#1a3a38' : '#1a1a2e',
                          border: `1px solid ${isSelected ? '#2ec4b6' : '#2d2d4e'}`,
                          color: isSelected ? '#2ec4b6' : '#94a3b8',
                        }}
                      >
                        {t.crest_url ? (
                          <img src={t.crest_url} alt="" className="w-5 h-5 object-contain shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0" style={{ backgroundColor: '#2d2d4e' }}>
                            {t.name?.[0]}
                          </div>
                        )}
                        <span className="truncate text-sm">{t.name}</span>
                        {isSelected && <span className="ml-auto shrink-0">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

        <button
          type="submit" disabled={loading || selected.length < 4}
          className="py-2.5 rounded-lg font-semibold text-sm"
          style={{
            backgroundColor: '#2ec4b6',
            color: '#0a0a0f',
            opacity: selected.length < 4 ? 0.5 : 1,
            cursor: selected.length < 4 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : `Create League with ${selected.length} teams`}
        </button>
      </form>
    </div>
  )
}
