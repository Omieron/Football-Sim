import { useState, useEffect } from 'react'
import api from '../api/axios'
import MatchCard from '../components/MatchCard'
import MatchSummaryModal from '../components/MatchSummaryModal'
import LeagueSelect from '../components/LeagueSelect'
import { useReveal } from '../hooks/useReveal'

export default function Fixtures() {
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [league, setLeague] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [viewWeek, setViewWeek] = useState(1)
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
    Promise.all([
      api.get(`/api/leagues/${selectedId}`),
      api.get(`/api/leagues/${selectedId}/fixtures`),
    ])
      .then(([lg, fx]) => {
        const lgData = lg.data.data
        const allMatches = fx.data.data || []
        const maxWeek = allMatches.reduce((m, x) => Math.max(m, x.week), 0)
        setLeague(lgData)
        setFixtures(allMatches)
        const playedWeek = Math.max(1, lgData?.current_week || 1)
        setViewWeek(Math.min(Math.max(1, playedWeek), maxWeek || 1))
      })
      .finally(() => setLoading(false))
  }, [selectedId])

  const totalWeeks = fixtures.reduce((m, x) => Math.max(m, x.week), 0)

  const grouped = fixtures.reduce((acc, m) => {
    if (!acc[m.week]) acc[m.week] = []
    acc[m.week].push(m)
    return acc
  }, {})

  const weekMatches = grouped[viewWeek] || []
  const weekPlayed = weekMatches.length > 0 && weekMatches.every(m => m.played)
  const weekUpcoming = league && viewWeek > league.current_week

  return (
    <>
      {/* Page header */}
      <div ref={headerRef} className={`reveal ${headerVisible ? 'in' : ''}`} style={{ marginBottom: 40 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
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

          <LeagueSelect
            leagues={leagues}
            value={selectedId}
            onChange={setSelectedId}
          />
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0' }}>
          <div className="spin" />
          <span className="label">Loading…</span>
        </div>
      )}

      {!loading && totalWeeks > 0 && (
        <>
          <div className="fixtures-week-bar">
            <div>
              <div className="label" style={{ marginBottom: 6 }}>
                Matchday {viewWeek}
                {weekUpcoming && (
                  <span style={{ color: 'var(--acid)', marginLeft: 6 }}>upcoming</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(237,232,220,0.25)', letterSpacing: '0.06em' }}>
                Week {viewWeek} of {totalWeeks}
                {league && (
                  <span style={{ marginLeft: 8, color: 'rgba(237,232,220,0.18)' }}>
                    · {league.current_week} played
                  </span>
                )}
              </div>
            </div>

            <div className="fixtures-week-nav">
              <button
                type="button"
                className="fixtures-week-btn"
                disabled={viewWeek <= 1}
                onClick={() => setViewWeek(w => w - 1)}
                aria-label="Previous matchday"
              >
                ‹
              </button>
              <button
                type="button"
                className="fixtures-week-btn"
                disabled={viewWeek >= totalWeeks}
                onClick={() => setViewWeek(w => w + 1)}
                aria-label="Next matchday"
              >
                ›
              </button>
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingBottom: 12, marginBottom: 4,
              borderBottom: '1px solid var(--border)',
            }}>
              {weekPlayed && (
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--pink)',
                  padding: '2px 6px', border: '1px solid var(--pink)',
                }}>
                  Played
                </span>
              )}
              {weekMatches.length === 0 && (
                <span style={{ fontSize: 11, color: 'rgba(237,232,220,0.3)' }}>
                  No fixtures for this matchday.
                </span>
              )}
            </div>

            {weekMatches.map(m => (
              <MatchCard key={m.id} match={m} onSummary={setSummaryMatch} />
            ))}
          </div>
        </>
      )}

      {!loading && totalWeeks === 0 && selectedId && (
        <p style={{ fontSize: 11, color: 'rgba(237,232,220,0.3)', lineHeight: 1.6, padding: '8px 0' }}>
          No fixtures yet for this league.
        </p>
      )}

      {summaryMatch && (
        <MatchSummaryModal match={summaryMatch} onClose={() => setSummaryMatch(null)} />
      )}
    </>
  )
}
