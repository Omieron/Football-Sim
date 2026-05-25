import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
      style={{
        borderColor: '#2ec4b6 #2ec4b6 #2ec4b6 transparent',
        animationDuration: '0.7s',
      }}
    />
  )
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

export default function Import() {
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetConfirm, setResetConfirm] = useState('')

  useEffect(() => {
    api.get('/api/admin/espn-leagues').then(r => setLeagues(r.data.data || []))
  }, [])

  function toggle(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  async function handleReset() {
    setResetting(true)
    try {
      await api.delete('/api/admin/reset')
      setShowResetModal(false)
      setResetConfirm('')
      setResult(null)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Reset failed.')
    } finally {
      setResetting(false)
    }
  }

  async function handleImport() {
    if (selected.length === 0) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const r = await api.post('/api/admin/seed', { league_codes: selected })
      setResult(r.data.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Import failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-200">Import from ESPN</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Select leagues to pull teams and full squads. Free, no API key needed.
        </p>
      </div>

      {/* League grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#64748b' }}>
            {selected.length} / {leagues.length} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(leagues.map(l => l.code))}
              className="text-xs px-3 py-1 rounded"
              style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
            >
              Select All
            </button>
            <button
              onClick={() => setSelected([])}
              className="text-xs px-3 py-1 rounded"
              style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
            >
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
                onClick={() => !loading && toggle(l.code)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isSelected ? '#1a3a38' : '#1a1a2e',
                  border: `1px solid ${isSelected ? '#2ec4b6' : '#2d2d4e'}`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <span className="text-xl">{flagMap[l.code] || '🌍'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: isSelected ? '#2ec4b6' : '#e2e8f0' }}>
                    {l.name}
                  </div>
                  <div className="text-xs" style={{ color: '#475569' }}>{l.code}</div>
                </div>
                {isSelected && <span style={{ color: '#2ec4b6' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={selected.length === 0 || loading}
        className="py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-3"
        style={{
          backgroundColor: '#2ec4b6',
          color: '#0a0a0f',
          opacity: selected.length === 0 || loading ? 0.5 : 1,
          cursor: selected.length === 0 || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <>
            <Spinner />
            Importing {selected.length} league{selected.length !== 1 ? 's' : ''}…
            <span className="text-xs font-normal opacity-70">(~20s per league)</span>
          </>
        ) : (
          `Import ${selected.length} League${selected.length !== 1 ? 's' : ''}`
        )}
      </button>

      {/* Loading info box */}
      {loading && (
        <div
          className="rounded-lg px-4 py-3 flex items-center gap-3 text-sm"
          style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}
        >
          <Spinner />
          <span style={{ color: '#94a3b8' }}>
            Fetching teams and full squads from ESPN. Please wait, this can take up to{' '}
            <span style={{ color: '#e2e8f0' }}>{selected.length * 20} seconds</span>.
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#2d1a1a', border: '1px solid #ef4444', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="rounded-lg p-4 flex items-center gap-6" style={{ backgroundColor: '#1a3a38', border: '1px solid #2ec4b6' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#2ec4b6' }}>{result.total_teams}</div>
            <div className="text-xs text-slate-400">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#2ec4b6' }}>{result.total_players}</div>
            <div className="text-xs text-slate-400">Players</div>
          </div>
          <div className="text-sm text-slate-300 ml-2">
            Import complete! Go to{' '}
            <a href="/leagues/new" className="underline" style={{ color: '#2ec4b6' }}>New League</a>
            {' '}to create a league with these teams.
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-lg p-4 flex flex-col gap-3 mt-4" style={{ border: '1px solid #3d1a1a' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#ef4444' }}>Danger Zone</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-slate-300">Clear entire database</p>
            <p className="text-xs" style={{ color: '#64748b' }}>
              Deletes all teams, players, leagues, matches and competitions. Cannot be undone.
            </p>
          </div>
          <button
            onClick={() => { setShowResetModal(true); setResetConfirm('') }}
            className="text-sm px-4 py-2 rounded-lg font-semibold"
            style={{ backgroundColor: '#2d1a1a', color: '#ef4444', border: '1px solid #ef4444' }}
          >
            Clear Database
          </button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: '#1a1a2e', border: '1px solid #ef4444' }}>
            <div>
              <p className="font-bold text-slate-200">Are you sure?</p>
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                This will permanently delete <strong style={{ color: '#e2e8f0' }}>everything</strong> — all teams, players, leagues and match history.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: '#64748b' }}>
                Type <span className="font-mono font-bold" style={{ color: '#ef4444' }}>DELETE</span> to confirm
              </label>
              <input
                autoFocus
                value={resetConfirm}
                onChange={e => setResetConfirm(e.target.value)}
                placeholder="DELETE"
                className="rounded-lg px-3 py-2 text-sm outline-none text-slate-200 font-mono"
                style={{ backgroundColor: '#0d0d18', border: '1px solid #3d1a1a' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetConfirm !== 'DELETE' || resetting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: resetConfirm === 'DELETE' ? '#ef4444' : '#2d1a1a',
                  color: resetConfirm === 'DELETE' ? '#fff' : '#64748b',
                  cursor: resetConfirm !== 'DELETE' ? 'not-allowed' : 'pointer',
                }}
              >
                {resetting ? 'Clearing…' : 'Clear Everything'}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
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
