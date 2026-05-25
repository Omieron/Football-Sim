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
  const [resetting, setResetting] = useState(false)
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

  const teamIds = new Set()
  fixtures.forEach(m => {
    teamIds.add(m.home_team_id)
    teamIds.add(m.away_team_id)
  })
  const teamCount = teamIds.size
  const expectedWeeks = teamCount > 1 ? (teamCount - 1) * 2 : 0
  const matchesPerWeek = teamCount > 1 ? teamCount / 2 : 0
  const scheduleIncomplete = teamCount > 1 && totalWeeks > 0 && totalWeeks < expectedWeeks
  const weekCap = scheduleIncomplete ? expectedWeeks : totalWeeks

  async function regenerateSchedule() {
    if (!selectedId) return
    const ok = window.confirm(
      'Regenerate the full home-and-away schedule? All played results, events and standings will be cleared.'
    )
    if (!ok) return
    setResetting(true)
    try {
      await api.delete(`/api/leagues/${selectedId}/reset`)
      const [lg, fx] = await Promise.all([
        api.get(`/api/leagues/${selectedId}`),
        api.get(`/api/leagues/${selectedId}/fixtures`),
      ])
      const lgData = lg.data.data
      const allMatches = fx.data.data || []
      setLeague(lgData)
      setFixtures(allMatches)
      setViewWeek(1)
    } finally {
      setResetting(false)
    }
  }

  const grouped = fixtures.reduce((acc, m) => {
    if (!acc[m.week]) acc[m.week] = []
    acc[m.week].push(m)
    return acc
  }, {})

  const weekMatches = grouped[viewWeek] || []
  const weekPlayed = weekMatches.length > 0 && weekMatches.every(m => m.played)
  const weekUpcoming = league && viewWeek > league.current_week
  const seasonComplete = league?.status === 'finished'
  const playedInWeek = weekMatches.filter(m => m.played).length

  return (
    <div className="fixtures-page">
      <header ref={headerRef} className={`fixtures-hero reveal ${headerVisible ? 'in' : ''}`}>
        <div className="fixtures-hero-top">
          <div className="fixtures-hero-title">
            <span className="label" style={{ display: 'block', marginBottom: 10 }}>Season Schedule</span>
            <LeagueSelect
              leagues={leagues}
              value={selectedId}
              onChange={setSelectedId}
              variant="hero"
            />
          </div>
        </div>

        {league && selectedId && (
          <div className="fixtures-hero-meta">
            <div className="fixtures-hero-progress">
              <div className="fixtures-hero-progress-row">
                <span className="label">
                  Week {Math.min(league.current_week, weekCap || league.current_week)} of {weekCap || '—'}
                  {seasonComplete ? ' · Season complete' : ' · In progress'}
                </span>
                {loading && <div className="spin" />}
              </div>
              {weekCap > 0 && (
                <div className="dash-progress-track" aria-hidden="true">
                  <div
                    className="dash-progress-fill"
                    style={{
                      width: `${Math.min(100, (Math.min(league.current_week, weekCap) / weekCap) * 100)}%`,
                    }}
                  />
                </div>
              )}
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
              <span className="fixtures-week-label">MD {viewWeek}</span>
              <button
                type="button"
                className="fixtures-week-btn"
                disabled={viewWeek >= weekCap}
                onClick={() => setViewWeek(w => w + 1)}
                aria-label="Next matchday"
              >
                ›
              </button>
            </div>

            <span className={`dash-status-badge ${seasonComplete ? 'is-complete' : 'is-active'}`}>
              {seasonComplete ? 'Season Complete' : weekUpcoming ? 'Upcoming' : 'Active'}
            </span>
          </div>
        )}
      </header>

      {loading && (
        <div className="fixtures-loading">
          <div className="spin" />
          <span className="label">Loading…</span>
        </div>
      )}

      {leagues.length === 0 && !loading && (
        <p className="fixtures-empty">No leagues yet. Create or import one to view fixtures.</p>
      )}

      {!loading && scheduleIncomplete && (
        <div className="fixtures-alert">
          <p>
            This league has <strong>{totalWeeks} matchdays</strong> but{' '}
            <strong>{teamCount} teams</strong> need a full home-and-away season —{' '}
            <strong>{expectedWeeks} matchdays</strong> ({matchesPerWeek} matches per week).
          </p>
          <button
            type="button"
            className="btn-outline fixtures-alert-btn"
            disabled={resetting}
            onClick={regenerateSchedule}
          >
            {resetting ? 'Regenerating…' : 'Regenerate full schedule'}
          </button>
        </div>
      )}

      {!loading && totalWeeks > 0 && selectedId && (
        <article className="fixtures-panel">
          <div className="fixtures-panel-head">
            <div>
              <span className="fixtures-panel-title">Matchday {viewWeek}</span>
              <span className="fixtures-panel-sub">
                {weekMatches.length} matches
                {weekPlayed && ' · All played'}
                {weekUpcoming && !weekPlayed && ' · Upcoming'}
                {playedInWeek > 0 && playedInWeek < weekMatches.length && ` · ${playedInWeek} played`}
              </span>
            </div>
            {weekPlayed && (
              <span className="fixtures-badge fixtures-badge-played">Played</span>
            )}
            {weekUpcoming && !weekPlayed && (
              <span className="fixtures-badge fixtures-badge-upcoming">Upcoming</span>
            )}
          </div>

          <div className="fixtures-panel-list scroll-y">
            {weekMatches.length === 0 ? (
              <p className="fixtures-empty fixtures-empty-inset">No fixtures for this matchday.</p>
            ) : (
              weekMatches.map(m => (
                <MatchCard key={m.id} match={m} onSummary={setSummaryMatch} />
              ))
            )}
          </div>
        </article>
      )}

      {!loading && totalWeeks === 0 && selectedId && (
        <p className="fixtures-empty">No fixtures yet for this league.</p>
      )}

      {summaryMatch && (
        <MatchSummaryModal match={summaryMatch} onClose={() => setSummaryMatch(null)} />
      )}
    </div>
  )
}
