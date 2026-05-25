import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useReveal } from '../hooks/useReveal'

const flagMap = {
  'eng.1': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'eng.2': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'esp.1': '🇪🇸', 'ger.1': '🇩🇪',
  'ita.1': '🇮🇹', 'fra.1': '🇫🇷',
  'tur.1': '🇹🇷', 'ned.1': '🇳🇱',
  'por.1': '🇵🇹', 'sco.1': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
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
  const [headerRef, headerVisible] = useReveal()

  async function loadLeagues() {
    const r = await api.get('/api/admin/espn-leagues')
    const seen = new Set()
    const unique = (r.data.data || []).filter(l => {
      if (seen.has(l.code)) return false
      seen.add(l.code)
      return true
    })
    setLeagues(unique)
    setSelected(prev => prev.filter(code => {
      const league = unique.find(l => l.code === code)
      return league && !league.imported
    }))
  }

  useEffect(() => { loadLeagues() }, [])

  function toggle(code) {
    const league = leagues.find(l => l.code === code)
    if (league?.imported) return
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const importable = leagues.filter(l => !l.imported)

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
      await loadLeagues()
    } catch (e) {
      setError(e.response?.data?.error || 'Import failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div ref={headerRef} className={`reveal ${headerVisible ? 'in' : ''}`} style={{ marginBottom: 56 }}>
        <div className="label" style={{ marginBottom: 10 }}>Data Source</div>
        <div style={{
          fontSize: 'clamp(40px,8vw,100px)', fontWeight: 700,
          letterSpacing: '-0.05em', lineHeight: 0.88, color: 'var(--cream)',
        }}>
          Import
        </div>
        <p style={{ fontSize: 12, color: 'rgba(237,232,220,0.35)', marginTop: 16, lineHeight: 1.7 }}>
          Pull teams and full squads from ESPN. Free, no API key required.
        </p>
      </div>

      {/* League selection */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="label">
            Leagues
            <span style={{ color: 'rgba(237,232,220,0.25)', marginLeft: 8 }}>
              {selected.length}/{importable.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSelected(importable.map(l => l.code))}
              disabled={importable.length === 0}
              className="btn-ghost"
            >All</button>
            <button onClick={() => setSelected([])} className="btn-ghost">Clear</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {leagues.map(l => {
            const isSelected = selected.includes(l.code)
            const isImported = l.imported
            const disabled = loading || isImported
            return (
              <button
                key={l.code}
                onClick={() => !disabled && toggle(l.code)}
                disabled={disabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', textAlign: 'left',
                  background: isImported
                    ? 'rgba(237,232,220,0.02)'
                    : isSelected ? 'rgba(212,255,0,0.05)' : 'transparent',
                  border: `1px solid ${isImported ? 'var(--border)' : isSelected ? 'var(--acid)' : 'var(--border)'}`,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: isImported ? 0.45 : loading ? 0.6 : 1,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, filter: isImported ? 'grayscale(1)' : 'none' }}>
                  {flagMap[l.code] || '🌍'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, letterSpacing: '-0.01em',
                    fontWeight: isSelected ? 600 : 400,
                    color: isImported ? 'rgba(237,232,220,0.35)' : isSelected ? 'var(--acid)' : 'var(--cream)',
                  }}>
                    {l.name}
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(237,232,220,0.25)', marginTop: 2,
                  }}>
                    {isImported ? 'Already imported' : l.code}
                  </div>
                </div>
                {isImported ? (
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(237,232,220,0.3)', flexShrink: 0, letterSpacing: '0.08em' }}>✓ IN</span>
                ) : isSelected && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--acid)', flexShrink: 0 }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={selected.length === 0 || loading}
        className="btn-acid"
        style={{
          width: '100%',
          opacity: selected.length === 0 || loading ? 0.4 : 1,
          cursor: selected.length === 0 || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading
          ? `Importing ${selected.length} league${selected.length !== 1 ? 's' : ''}…`
          : `Import ${selected.length} League${selected.length !== 1 ? 's' : ''}`
        }
      </button>

      {/* Loading info */}
      {loading && (
        <div style={{
          marginTop: 16, padding: '14px 16px',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 12, color: 'rgba(237,232,220,0.45)', lineHeight: 1.6,
        }}>
          <div className="spin" style={{ flexShrink: 0 }} />
          Fetching teams and squads from ESPN. Up to{' '}
          <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{selected.length * 20}s</span>.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '14px 16px',
          borderLeft: '2px solid var(--pink)',
          fontSize: 12, color: 'var(--pink)',
        }}>
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={{
          marginTop: 16, padding: '28px 24px',
          border: '1px solid var(--acid)',
          display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 40, fontWeight: 700, letterSpacing: '-0.05em',
              color: 'var(--acid)', lineHeight: 1,
            }}>
              {result.total_teams}
            </div>
            <div className="label" style={{ marginTop: 6 }}>Teams</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 40, fontWeight: 700, letterSpacing: '-0.05em',
              color: 'var(--acid)', lineHeight: 1,
            }}>
              {result.total_players}
            </div>
            <div className="label" style={{ marginTop: 6 }}>Players</div>
          </div>
          <div style={{ flex: 1, fontSize: 12, color: 'rgba(237,232,220,0.5)', lineHeight: 1.7, minWidth: 160 }}>
            Import complete.{' '}
            <a href="/leagues/new" style={{ color: 'var(--acid)', textDecoration: 'underline' }}>
              Create a league
            </a>
            {' '}with these teams.
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div style={{ marginTop: 80, borderTop: '1px solid rgba(255,31,90,0.2)', paddingTop: 32 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 20,
        }}>
          Danger Zone
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', letterSpacing: '-0.01em', marginBottom: 4 }}>
              Clear entire database
            </div>
            <div style={{ fontSize: 11, color: 'rgba(237,232,220,0.35)', lineHeight: 1.7 }}>
              Deletes all teams, players, leagues and match history. Cannot be undone.
            </div>
          </div>
          <button
            onClick={() => { setShowResetModal(true); setResetConfirm('') }}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--pink)',
              color: 'var(--pink)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink)'; e.currentTarget.style.color = 'var(--black)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pink)' }}
          >
            Clear Database
          </button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(16px)',
          padding: 24,
        }}>
          <div style={{
            width: '100%', maxWidth: 380,
            padding: '40px 36px',
            background: 'var(--dark)',
            border: '1px solid var(--pink)',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 16,
            }}>
              Confirmation Required
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em',
              color: 'var(--cream)', marginBottom: 12, lineHeight: 1.2,
            }}>
              This will destroy everything.
            </div>
            <p style={{ fontSize: 12, color: 'rgba(237,232,220,0.4)', lineHeight: 1.7, marginBottom: 28 }}>
              All teams, players, leagues, and match history will be permanently deleted.
            </p>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: 'rgba(237,232,220,0.4)', marginBottom: 10 }}>
                Type{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--pink)', letterSpacing: '0.1em' }}>
                  DELETE
                </span>
                {' '}to confirm
              </div>
              <input
                autoFocus
                value={resetConfirm}
                onChange={e => setResetConfirm(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${resetConfirm === 'DELETE' ? 'var(--pink)' : 'var(--border)'}`,
                  color: 'var(--pink)', fontSize: 16,
                  fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em',
                  padding: '6px 0', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleReset}
                disabled={resetConfirm !== 'DELETE' || resetting}
                style={{
                  flex: 1, padding: '12px',
                  background: resetConfirm === 'DELETE' ? 'var(--pink)' : 'transparent',
                  border: `1px solid ${resetConfirm === 'DELETE' ? 'var(--pink)' : 'var(--border)'}`,
                  color: resetConfirm === 'DELETE' ? 'var(--black)' : 'rgba(237,232,220,0.2)',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  cursor: resetConfirm !== 'DELETE' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}
              >
                {resetting ? 'Clearing…' : 'Clear Everything'}
              </button>
              <button onClick={() => setShowResetModal(false)} className="btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
