import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import StandingsTable from '../components/StandingsTable'
import PredictionWidget from '../components/PredictionWidget'
import MatchCard from '../components/MatchCard'
import LiveMatchModal from '../components/LiveMatchModal'

export default function Dashboard() {
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [league, setLeague] = useState(null)
  const [standings, setStandings] = useState([])
  const [predictions, setPredictions] = useState([])
  const [weekMatches, setWeekMatches] = useState([])
  const [viewWeek, setViewWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(0)
  const [liveMatches, setLiveMatches] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/leagues').then(r => {
      const list = r.data.data || []
      setLeagues(list)
      if (list.length > 0) setSelectedId(list[0].id)
    })
  }, [])

  const fetchWeekMatches = useCallback(async (leagueId, week) => {
    try {
      const r = await api.get(`/api/leagues/${leagueId}/weeks/${week}`)
      setWeekMatches(r.data.data || [])
    } catch {
      setWeekMatches([])
    }
  }, [])

  const fetchLeagueData = useCallback(async (id, jumpToWeek) => {
    if (!id) return
    setLoading(true)
    try {
      const [lg, st, fx] = await Promise.all([
        api.get(`/api/leagues/${id}`),
        api.get(`/api/leagues/${id}/standings`),
        api.get(`/api/leagues/${id}/fixtures`),
      ])
      const lgData = lg.data.data
      const allMatches = fx.data.data || []

      // derive total weeks from fixture
      const maxWeek = allMatches.reduce((m, x) => Math.max(m, x.week), 0)
      setTotalWeeks(maxWeek)
      setLeague(lgData)
      setStandings(st.data.data || [])

      if (lgData.current_week >= 4) {
        api.get(`/api/leagues/${id}/predictions`)
          .then(r => setPredictions(r.data.data || []))
          .catch(() => setPredictions([]))
      } else {
        setPredictions([])
      }

      // which week to display
      const target = jumpToWeek ?? Math.max(1, lgData.current_week === maxWeek ? maxWeek : lgData.current_week + 1)
      setViewWeek(target)
      fetchWeekMatches(id, target)
    } finally {
      setLoading(false)
    }
  }, [fetchWeekMatches])

  useEffect(() => {
    fetchLeagueData(selectedId)
  }, [selectedId, fetchLeagueData])

  useEffect(() => {
    if (selectedId && viewWeek) fetchWeekMatches(selectedId, viewWeek)
  }, [viewWeek, selectedId, fetchWeekMatches])

  async function handlePlayWeek() {
    if (!league) return
    const week = league.current_week + 1
    const r = await api.post(`/api/leagues/${selectedId}/weeks/${week}/play`)
    setLiveMatches(r.data.data || [])
  }

  async function handlePlayAll() {
    if (!league) return
    await api.post(`/api/leagues/${selectedId}/play-all`)
    fetchLeagueData(selectedId)
  }

  function handleModalClose() {
    setLiveMatches(null)
    fetchLeagueData(selectedId)
  }

  const nextWeek = league ? league.current_week + 1 : 1
  const allPlayed = league && league.status === 'finished'
  const isNextWeekView = viewWeek === nextWeek && !allPlayed

  return (
    <div className="flex flex-col gap-6">
      {/* League selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-200">Dashboard</h1>
        <select
          value={selectedId || ''}
          onChange={e => setSelectedId(Number(e.target.value))}
          className="text-sm rounded-lg px-3 py-2 outline-none"
          style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e', color: '#e2e8f0' }}
        >
          {leagues.length === 0 && <option>No leagues</option>}
          {leagues.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {league && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}>
              Week {league.current_week} / {league.status}
            </span>
            {!allPlayed && (
              <>
                <button
                  onClick={handlePlayWeek}
                  className="text-sm px-4 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: '#2ec4b6', color: '#0a0a0f' }}
                >
                  Play Week {nextWeek}
                </button>
                <button
                  onClick={handlePlayAll}
                  className="text-sm px-4 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: '#1a1a2e', color: '#2ec4b6', border: '1px solid #2ec4b6' }}
                >
                  Play All
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-slate-300">Standings</h2>
              <StandingsTable standings={standings} />
            </div>

            <div className="flex flex-col gap-4">
              {predictions.length > 0 && <PredictionWidget predictions={predictions} />}

              {/* Week navigator */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-300">
                    Week {viewWeek}
                    {isNextWeekView && (
                      <span className="ml-2 text-xs font-normal" style={{ color: '#2ec4b6' }}>upcoming</span>
                    )}
                    {weekMatches.length > 0 && weekMatches[0].played && (
                      <span className="ml-2 text-xs font-normal" style={{ color: '#64748b' }}>played</span>
                    )}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={viewWeek <= 1}
                      onClick={() => setViewWeek(w => w - 1)}
                      className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                      style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
                    >
                      ‹
                    </button>
                    <span className="text-xs px-1" style={{ color: '#64748b' }}>{viewWeek}/{totalWeeks}</span>
                    <button
                      disabled={viewWeek >= totalWeeks}
                      onClick={() => setViewWeek(w => w + 1)}
                      className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                      style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
                    >
                      ›
                    </button>
                  </div>
                </div>

                {weekMatches.length > 0
                  ? weekMatches.map(m => <MatchCard key={m.id} match={m} />)
                  : <p className="text-xs" style={{ color: '#475569' }}>No matches for this week.</p>
                }
              </div>
            </div>
          </div>
        </>
      )}

      {leagues.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">⚽</p>
          <p>No leagues yet. <a href="/leagues/new" className="underline" style={{ color: '#2ec4b6' }}>Create one</a>.</p>
        </div>
      )}

      {liveMatches && (
        <LiveMatchModal matches={liveMatches} onClose={handleModalClose} />
      )}
    </div>
  )
}
