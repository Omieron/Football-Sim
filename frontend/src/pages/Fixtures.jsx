import { useState, useEffect } from 'react'
import api from '../api/axios'
import MatchCard from '../components/MatchCard'
import MatchSummaryModal from '../components/MatchSummaryModal'
import { useReveal } from '../hooks/useReveal'

export default function Fixtures() {
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(false)
  const [summaryMatch, setSummaryMatch] = useState(null)
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
                <MatchCard key={m.id} match={m} onSummary={setSummaryMatch} />
              ))}
            </div>
          )
        })}
      </div>

      {summaryMatch && (
        <MatchSummaryModal match={summaryMatch} onClose={() => setSummaryMatch(null)} />
      )}
    </>
  )
}
