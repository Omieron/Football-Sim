import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function Import() {
  const [leagues, setLeagues] = useState([])
  const [selected, setSelected] = useState([])
  const [status, setStatus] = useState(null) // null | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])

  useEffect(() => {
    api.get('/api/admin/espn-leagues').then(r => setLeagues(r.data.data || []))
  }, [])

  function toggle(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  function selectAll() {
    setSelected(leagues.map(l => l.code))
  }

  function clearAll() {
    setSelected([])
  }

  async function handleSeed() {
    if (selected.length === 0) return
    setStatus('loading')
    setResult(null)
    setLog([`Importing ${selected.length} league(s) from ESPN...`])

    try {
      const r = await api.post('/api/admin/seed', { league_codes: selected })
      setResult(r.data.data)
      setLog(prev => [
        ...prev,
        `Done! ${r.data.data.total_teams} teams, ${r.data.data.total_players} players imported.`,
      ])
      setStatus('done')
    } catch (e) {
      setLog(prev => [...prev, `Error: ${e.response?.data?.error || e.message}`])
      setStatus('error')
    }
  }

  const flagMap = {
    'eng.1': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'eng.2': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'esp.1': '🇪🇸',
    'ger.1': '🇩🇪',
    'ita.1': '🇮🇹',
    'fra.1': '🇫🇷',
    'tur.1': '🇹🇷',
    'ned.1': '🇳🇱',
    'por.1': '🇵🇹',
    'sco.1': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-200">Import from ESPN</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Select leagues to pull teams and full squads from ESPN. Free, no API key needed.
        </p>
      </div>

      {/* League grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{selected.length} / {leagues.length} selected</span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}>
              Select All
            </button>
            <button onClick={clearAll} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}>
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {leagues.map(l => {
            const isSelected = selected.includes(l.code)
            return (
              <button
                key={l.code}
                onClick={() => toggle(l.code)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
                style={{
                  backgroundColor: isSelected ? '#1a3a38' : '#1a1a2e',
                  border: `1px solid ${isSelected ? '#2ec4b6' : '#2d2d4e'}`,
                }}
              >
                <span className="text-xl">{flagMap[l.code] || '🌍'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: isSelected ? '#2ec4b6' : '#e2e8f0' }}>
                    {l.name}
                  </div>
                  <div className="text-xs" style={{ color: '#475569' }}>{l.code}</div>
                </div>
                {isSelected && (
                  <span className="text-sm" style={{ color: '#2ec4b6' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={handleSeed}
        disabled={selected.length === 0 || status === 'loading'}
        className="py-3 rounded-lg font-semibold text-sm transition-opacity"
        style={{
          backgroundColor: '#2ec4b6',
          color: '#0a0a0f',
          opacity: selected.length === 0 || status === 'loading' ? 0.5 : 1,
          cursor: selected.length === 0 || status === 'loading' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'loading'
          ? 'Importing... (this may take ~20s per league)'
          : `Import ${selected.length} League${selected.length !== 1 ? 's' : ''}`}
      </button>

      {/* Log output */}
      {log.length > 0 && (
        <div className="rounded-lg p-4 font-mono text-xs flex flex-col gap-1" style={{ backgroundColor: '#0d0d18', border: '1px solid #2d2d4e' }}>
          {log.map((line, i) => (
            <span key={i} style={{ color: i === log.length - 1 && status === 'done' ? '#2ec4b6' : '#94a3b8' }}>
              {line}
            </span>
          ))}
          {status === 'loading' && (
            <span style={{ color: '#475569' }}>⏳ Fetching squads from ESPN...</span>
          )}
        </div>
      )}

      {/* Result summary */}
      {result && status === 'done' && (
        <div className="rounded-lg p-4 flex gap-6" style={{ backgroundColor: '#1a3a38', border: '1px solid #2ec4b6' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#2ec4b6' }}>{result.total_teams}</div>
            <div className="text-xs text-slate-400">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#2ec4b6' }}>{result.total_players}</div>
            <div className="text-xs text-slate-400">Players</div>
          </div>
          <div className="flex items-center text-sm text-slate-300 ml-2">
            Teams and players are now in your database. Go to{' '}
            <a href="/leagues/new" className="ml-1 underline" style={{ color: '#2ec4b6' }}>New League</a>
            {' '}to create a league.
          </div>
        </div>
      )}
    </div>
  )
}
