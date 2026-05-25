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

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-200">New League</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required placeholder="League name"
          value={name} onChange={e => setName(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
          style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400">Select teams <span style={{ color: '#64748b' }}>({selected.length} selected, min 4)</span></p>
          <div className="grid grid-cols-2 gap-2">
            {teams.map(t => {
              const isSelected = selected.includes(t.id)
              return (
                <button
                  key={t.id} type="button"
                  onClick={() => toggle(t.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                  style={{
                    backgroundColor: isSelected ? '#1a3a38' : '#1a1a2e',
                    border: `1px solid ${isSelected ? '#2ec4b6' : '#2d2d4e'}`,
                    color: isSelected ? '#2ec4b6' : '#94a3b8',
                  }}
                >
                  {t.crest_url ? (
                    <img src={t.crest_url} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: '#2d2d4e' }}>
                      {t.name?.[0]}
                    </div>
                  )}
                  <span className="truncate">{t.name}</span>
                  {isSelected && <span className="ml-auto">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

        <button
          type="submit" disabled={loading || selected.length < 4}
          className="py-2.5 rounded-lg font-semibold text-sm transition-opacity"
          style={{
            backgroundColor: '#2ec4b6',
            color: '#0a0a0f',
            opacity: selected.length < 4 ? 0.5 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create League'}
        </button>
      </form>
    </div>
  )
}
