import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import LeagueSelect from '../components/LeagueSelect'
import { useReveal } from '../hooks/useReveal'

const PANELS = [
  { key: 'goals', label: 'Goals', statKey: 'goals', accent: 'var(--pink)' },
  { key: 'assists', label: 'Assists', statKey: 'assists', accent: 'var(--acid)' },
  { key: 'cards', label: 'Discipline', statKey: 'total_cards', accent: '#ff9f43' },
]

function StatRow({ rank, player, accent, value, isDiscipline }) {
  const isTop = rank === 1
  return (
    <div className={`stats-row${isTop ? ' stats-row-top' : ''}${isDiscipline ? ' stats-row-cards' : ''}`}>
      <span className="stats-row-rank">{rank}</span>
      <div className="stats-row-player">
        {player.crest_url
          ? <img src={player.crest_url} alt="" className="stats-row-crest" />
          : <span className="stats-row-crest stats-row-crest-fallback" />
        }
        <div className="stats-row-names">
          <span className="stats-row-name">{player.player_name}</span>
          <span className="stats-row-team">{player.team_name}</span>
        </div>
      </div>
      {isDiscipline ? (
        <>
          <span className="stats-row-yel">{player.yellow_cards}</span>
          <span className="stats-row-red">{player.red_cards}</span>
          <span className="stats-row-val" style={{ color: isTop ? accent : undefined }}>{value}</span>
        </>
      ) : (
        <span className="stats-row-val" style={{ color: isTop ? accent : undefined }}>{value}</span>
      )}
    </div>
  )
}

function StatCard({ panel, rows, loading }) {
  const isDiscipline = panel.key === 'cards'
  const statKey = panel.key === 'cards' ? 'total_cards' : panel.statKey

  return (
    <article className="stats-card">
      <div className="stats-card-head" style={{ borderLeftColor: panel.accent }}>
        <span className="stats-card-title">{panel.label}</span>
        {rows.length > 0 && (
          <span className="stats-card-count">{rows.length} players</span>
        )}
      </div>

      {loading ? (
        <div className="stats-card-loading">
          <div className="spin" />
          <span className="label">Loading…</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="stats-card-empty">
          {panel.key === 'goals' && 'No goals recorded yet. Play matchdays or recalculate stats.'}
          {panel.key === 'assists' && 'No assists recorded yet.'}
          {panel.key === 'cards' && 'No cards recorded yet.'}
        </p>
      ) : (
        <div className="stats-card-scroll scroll-y">
          <div className={`stats-table-head${isDiscipline ? ' stats-table-head-cards' : ''}`}>
            <span>#</span>
            <span>Player</span>
            {isDiscipline ? (
              <>
                <span>YC</span>
                <span>RC</span>
                <span>Tot</span>
              </>
            ) : (
              <span>{panel.label}</span>
            )}
          </div>
          <div className="stats-table-body">
            {rows.map((p, i) => (
              <StatRow
                key={`${p.player_name}-${p.team_name}-${i}`}
                rank={i + 1}
                player={p}
                accent={panel.accent}
                value={p[statKey]}
                isDiscipline={isDiscipline}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export default function Stats() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [league, setLeague] = useState(null)
  const [scorers, setScorers] = useState([])
  const [assists, setAssists] = useState([])
  const [mostCards, setMostCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [headerRef, headerVisible] = useReveal()

  const fetchStats = (id) => {
    setLoading(true)
    return Promise.allSettled([
      api.get(`/api/leagues/${id}`),
      api.get(`/api/leagues/${id}/top-scorers`),
      api.get(`/api/leagues/${id}/top-assists`),
      api.get(`/api/leagues/${id}/most-cards`),
    ])
      .then(([lg, sc, as, mc]) => {
        if (lg.status === 'fulfilled') setLeague(lg.value.data.data)
        setScorers(sc.status === 'fulfilled' ? (sc.value.data.data || []) : [])
        setAssists(as.status === 'fulfilled' ? (as.value.data.data || []) : [])
        setMostCards(mc.status === 'fulfilled' ? (mc.value.data.data || []) : [])
      })
      .finally(() => setLoading(false))
  }

  const recalculateStats = async () => {
    if (!selectedId || recalculating) return
    setRecalculating(true)
    try {
      await api.post(`/api/leagues/${selectedId}/regenerate-events`)
      await fetchStats(selectedId)
    } catch (err) {
      console.error(err)
    } finally {
      setRecalculating(false)
    }
  }

  useEffect(() => {
    api.get('/api/leagues').then(r => {
      const list = r.data.data || []
      setLeagues(list)
      const fromUrl = Number(searchParams.get('league'))
      const initial = list.find(l => l.id === fromUrl)?.id ?? list[0]?.id ?? null
      setSelectedId(initial)
    })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setSearchParams({ league: String(selectedId) }, { replace: true })
    fetchStats(selectedId)
  }, [selectedId])

  const dataByKey = { goals: scorers, assists, cards: mostCards }
  const seasonComplete = league?.status === 'finished'
  const topScorer = scorers[0]
  const topAssist = assists[0]
  const topCards = mostCards[0]

  return (
    <div className="stats-page">
      <header ref={headerRef} className={`stats-hero reveal ${headerVisible ? 'in' : ''}`}>
        <div className="stats-hero-top">
          <div className="stats-hero-title">
            <span className="label" style={{ display: 'block', marginBottom: 10 }}>Player Statistics</span>
            <LeagueSelect
              leagues={leagues}
              value={selectedId}
              onChange={setSelectedId}
              variant="hero"
            />
          </div>
        </div>

        {selectedId && (
          <div className="stats-hero-meta">
            <div className="stats-hero-meta-left">
              {league && (
                <span className="label">
                  Week {league.current_week}
                  {seasonComplete ? ' · Season complete' : ' · In progress'}
                </span>
              )}
              {!loading && scorers.length === 0 && (
                <span className="stats-hint">
                  Goals missing from players? Recalculate to map them to real squads.
                </span>
              )}
            </div>
            <button
              type="button"
              className="stats-btn stats-btn-accent"
              disabled={recalculating || loading}
              onClick={recalculateStats}
            >
              {recalculating ? 'Recalculating…' : 'Recalculate stats'}
            </button>
          </div>
        )}
      </header>

      {leagues.length === 0 && !loading && (
        <p className="stats-page-empty">No leagues yet. Import or create one to track stats.</p>
      )}

      {selectedId && !loading && (topScorer || topAssist || topCards) && (
        <div className="stats-spotlight">
          {topScorer && (
            <div className="stats-spotlight-item" style={{ '--spot-accent': 'var(--pink)' }}>
              <span className="label">Top Scorer</span>
              <strong>{topScorer.player_name}</strong>
              <span>{topScorer.goals} goals · {topScorer.team_name}</span>
            </div>
          )}
          {topAssist && (
            <div className="stats-spotlight-item" style={{ '--spot-accent': 'var(--acid)' }}>
              <span className="label">Top Assists</span>
              <strong>{topAssist.player_name}</strong>
              <span>{topAssist.assists} assists · {topAssist.team_name}</span>
            </div>
          )}
          {topCards && (
            <div className="stats-spotlight-item" style={{ '--spot-accent': '#ff9f43' }}>
              <span className="label">Most Cards</span>
              <strong>{topCards.player_name}</strong>
              <span>{topCards.total_cards} cards · {topCards.team_name}</span>
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <div className="stats-grid">
          {PANELS.map(panel => (
            <StatCard
              key={panel.key}
              panel={panel}
              rows={dataByKey[panel.key]}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  )
}
