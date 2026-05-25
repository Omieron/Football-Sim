import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import StandingsTable from '../components/StandingsTable'
import PredictionWidget from '../components/PredictionWidget'
import LeagueSelect from '../components/LeagueSelect'
import LiveMatchModal from '../components/LiveMatchModal'

/* ── Match banner carousel ──────────────────────────────── */
function MatchBanner({ matches, totalWeeks, viewWeek, setViewWeek, isNextWeekView }) {
  const [idx, setIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => { setIdx(0); setAnimKey(k => k + 1) }, [viewWeek])

  useEffect(() => {
    if (matches.length <= 1) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => { const n = (i + 1) % matches.length; setAnimKey(k => k + 1); return n })
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [matches.length, viewWeek])

  if (matches.length === 0) return <p className="label" style={{ padding: '12px 0' }}>No matches this week.</p>

  const m = matches[idx]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div className="label">
            Matchday {viewWeek}
            {isNextWeekView && <span style={{ color: 'var(--acid)', marginLeft: 6 }}>upcoming</span>}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(237,232,220,0.2)', marginTop: 2 }}>{idx + 1} / {matches.length}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { ch: '‹', disabled: viewWeek <= 1,          fn: () => setViewWeek(w => w - 1) },
            { ch: '›', disabled: viewWeek >= totalWeeks, fn: () => setViewWeek(w => w + 1) },
          ].map(({ ch, disabled, fn }) => (
            <button key={ch} disabled={disabled} onClick={fn} style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--cream)', fontSize: 16, fontFamily: 'inherit',
              cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.2 : 1,
            }}>{ch}</button>
          ))}
        </div>
      </div>

      <div key={animKey} style={{
        padding: '18px 0',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        animation: 'bannerIn 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {m.home_crest_url
              ? <img src={m.home_crest_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              : <span style={{ width: 28, height: 28, background: 'var(--mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(237,232,220,0.3)' }}>{m.home_team_name?.[0]}</span>
            }
            <span style={{ fontSize: 12, fontWeight: m.played ? 600 : 300, color: m.played ? 'var(--cream)' : 'rgba(237,232,220,0.45)', textAlign: 'right', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {m.home_team_name}
            </span>
          </div>

          <div style={{ textAlign: 'center', minWidth: 64 }}>
            {m.played ? (
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--cream)' }}>
                {m.home_goals}<span style={{ color: 'rgba(237,232,220,0.2)', margin: '0 4px' }}>–</span>{m.away_goals}
              </div>
            ) : (
              <span className="label">vs</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            {m.away_crest_url
              ? <img src={m.away_crest_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              : <span style={{ width: 28, height: 28, background: 'var(--mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(237,232,220,0.3)' }}>{m.away_team_name?.[0]}</span>
            }
            <span style={{ fontSize: 12, fontWeight: m.played ? 600 : 300, color: m.played ? 'var(--cream)' : 'rgba(237,232,220,0.45)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {m.away_team_name}
            </span>
          </div>
        </div>
      </div>

      {matches.length > 1 && (
        <>
          <div style={{ height: 1, background: 'var(--border)' }}>
            <div key={`p-${animKey}`} style={{ height: 1, background: 'var(--acid)', animation: 'progressFill 5s linear forwards' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center' }}>
            {matches.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); setAnimKey(k => k + 1) }} style={{
                height: 3, border: 'none', cursor: 'pointer', padding: 0,
                width: i === idx ? 18 : 4,
                background: i === idx ? 'var(--acid)' : 'rgba(237,232,220,0.2)',
                transition: 'width 0.25s, background 0.25s',
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Full leader list (goals / assists) ──────────────────── */
function LeaderList({ players, statKey, emptyText, accent = 'var(--pink)', maxItems }) {
  if (players.length === 0) {
    return (
      <p style={{ fontSize: 11, color: 'rgba(237,232,220,0.3)', lineHeight: 1.6, padding: '8px 0' }}>{emptyText}</p>
    )
  }

  const shown = maxItems ? players.slice(0, maxItems) : players
  const max = players[0]?.[statKey] || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {shown.map((p, i) => {
        const isTop = i === 0
        const val = p[statKey]
        const pct = (val / max) * 100
        return (
          <div key={`${p.player_name}-${p.team_name}-${i}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                {p.crest_url
                  ? <img src={p.crest_url} alt="" style={{ width: 13, height: 13, objectFit: 'contain', flexShrink: 0 }} />
                  : <span style={{ width: 13, height: 13, background: 'var(--mid)', display: 'inline-block', flexShrink: 0 }} />
                }
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    display: 'block',
                    fontSize: isTop ? 13 : 11, fontWeight: isTop ? 700 : 400,
                    color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.5)',
                    letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.player_name}</span>
                  <span style={{
                    display: 'block', fontSize: 9, color: 'rgba(237,232,220,0.25)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.team_name}</span>
                </div>
              </div>
              <span style={{
                fontSize: isTop ? 20 : 13, fontWeight: 700, letterSpacing: '-0.04em',
                color: isTop ? accent : 'rgba(237,232,220,0.3)',
                lineHeight: 1, flexShrink: 0, marginLeft: 8,
              }}>{val}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }}>
              <div style={{
                height: 1, width: `${pct}%`,
                background: isTop ? accent : 'rgba(237,232,220,0.12)',
                transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Top 3 discipline (dashboard teaser) ─────────────────── */
function CardsMini({ players, leagueId, emptyText }) {
  const top = players.slice(0, 3)
  if (top.length === 0) {
    return (
      <p style={{ fontSize: 11, color: 'rgba(237,232,220,0.3)', lineHeight: 1.6, padding: '8px 0' }}>{emptyText}</p>
    )
  }

  return (
    <>
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 8,
        fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(237,232,220,0.2)',
      }}>
        <span>🟨</span><span>🟥</span><span>Tot</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {top.map((p, i) => {
          const isTop = i === 0
          return (
            <div key={`${p.player_name}-${p.team_name}-${i}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                {p.crest_url
                  ? <img src={p.crest_url} alt="" style={{ width: 13, height: 13, objectFit: 'contain', flexShrink: 0 }} />
                  : <span style={{ width: 13, height: 13, background: 'var(--mid)', display: 'inline-block', flexShrink: 0 }} />
                }
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: isTop ? 13 : 11, fontWeight: isTop ? 700 : 400,
                    color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.5)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.player_name}</span>
                  <span style={{
                    display: 'block', fontSize: 9, color: 'rgba(237,232,220,0.25)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.team_name}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#f5c518' }}>{p.yellow_cards}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pink)' }}>{p.red_cards}</span>
                <span style={{
                  fontSize: isTop ? 16 : 12, fontWeight: 700, color: isTop ? '#ff9f43' : 'rgba(237,232,220,0.3)',
                  minWidth: 18, textAlign: 'right',
                }}>{p.total_cards}</span>
              </div>
            </div>
          )
        })}
      </div>
      {leagueId && (
        <Link
          to={`/stats?league=${leagueId}`}
          style={{
            display: 'inline-block', marginTop: 12, fontSize: 10, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
            color: 'rgba(237,232,220,0.35)', transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--acid)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(237,232,220,0.35)' }}
        >
          All stats →
        </Link>
      )}
    </>
  )
}

/* ── Rotates between goal, assist & discipline leaderboards ─ */
function StatsRotator({ scorers, assists, mostCards, leagueId, loading }) {
  const panels = [
    {
      key: 'scorers',
      type: 'list',
      title: 'Top Scorers',
      players: scorers,
      statKey: 'goals',
      accent: 'var(--pink)',
      emptyText: 'No goals yet. Play a matchday to see the race.',
    },
    {
      key: 'assists',
      type: 'list',
      title: 'Top Assists',
      players: assists,
      statKey: 'assists',
      accent: 'var(--acid)',
      emptyText: 'No assists yet. Play a matchday to see the race.',
    },
    {
      key: 'cards',
      type: 'cards',
      title: 'Discipline',
      players: mostCards,
      accent: '#ff9f43',
      emptyText: 'No cards yet. Play a matchday to see bookings.',
    },
  ]

  const [idx, setIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef(null)
  const panel = panels[idx]

  useEffect(() => { setIdx(0); setAnimKey(k => k + 1) }, [scorers, assists, mostCards])

  useEffect(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => { const n = (i + 1) % panels.length; setAnimKey(k => k + 1); return n })
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [scorers, assists, mostCards])

  if (loading) {
    return (
      <div>
        <div className="label" style={{ marginBottom: 14 }}>Top Scorers</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <div className="spin" />
          <span style={{ fontSize: 11, color: 'rgba(237,232,220,0.35)' }}>Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="label">{panel.title}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {panels.map((p, i) => (
            <button
              key={p.key}
              onClick={() => { setIdx(i); setAnimKey(k => k + 1) }}
              style={{
                height: 3, border: 'none', cursor: 'pointer', padding: 0,
                width: i === idx ? 18 : 4,
                background: i === idx ? p.accent : 'rgba(237,232,220,0.2)',
                transition: 'width 0.25s, background 0.25s',
              }}
            />
          ))}
        </div>
      </div>

      <div key={animKey} style={{ animation: 'bannerIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        {panel.type === 'cards' ? (
          <CardsMini players={panel.players} leagueId={leagueId} emptyText={panel.emptyText} />
        ) : (
          <>
            <LeaderList
              players={panel.players}
              statKey={panel.statKey}
              emptyText={panel.emptyText}
              accent={panel.accent}
              maxItems={5}
            />
            {leagueId && (
              <Link
                to={`/stats?league=${leagueId}`}
                style={{
                  display: 'inline-block', marginTop: 12, fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
                  color: 'rgba(237,232,220,0.35)', transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = panel.accent }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(237,232,220,0.35)' }}
              >
                All stats →
              </Link>
            )}
          </>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginTop: 14 }}>
        <div
          key={`p-${animKey}`}
          style={{ height: 1, background: panel.accent, animation: 'progressFill 5s linear forwards' }}
        />
      </div>
    </div>
  )
}

/* ── Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [league, setLeague] = useState(null)
  const [standings, setStandings] = useState([])
  const [predictions, setPredictions] = useState([])
  const [topScorers, setTopScorers] = useState([])
  const [topAssists, setTopAssists] = useState([])
  const [mostCards, setMostCards] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
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
    } catch { setWeekMatches([]) }
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
      const maxWeek = allMatches.reduce((m, x) => Math.max(m, x.week), 0)
      setTotalWeeks(maxWeek)
      setLeague(lgData)
      setStandings(st.data.data || [])

      setStatsLoading(true)
      Promise.allSettled([
        api.get(`/api/leagues/${id}/top-scorers`),
        api.get(`/api/leagues/${id}/top-assists`),
        api.get(`/api/leagues/${id}/most-cards`),
      ])
        .then(([sc, as, mc]) => {
          setTopScorers(sc.status === 'fulfilled' ? (sc.value.data.data || []) : [])
          setTopAssists(as.status === 'fulfilled' ? (as.value.data.data || []) : [])
          setMostCards(mc.status === 'fulfilled' ? (mc.value.data.data || []) : [])
        })
        .finally(() => setStatsLoading(false))

      if (lgData.current_week >= 4) {
        api.get(`/api/leagues/${id}/predictions`)
          .then(r => setPredictions(r.data.data || []))
          .catch(() => setPredictions([]))
      } else {
        setPredictions([])
      }

      const target = jumpToWeek ?? Math.max(1, lgData.current_week === maxWeek ? maxWeek : lgData.current_week + 1)
      setViewWeek(target)
      fetchWeekMatches(id, target)
    } finally { setLoading(false) }
  }, [fetchWeekMatches])

  useEffect(() => { fetchLeagueData(selectedId) }, [selectedId, fetchLeagueData])
  useEffect(() => {
    if (selectedId && viewWeek) fetchWeekMatches(selectedId, viewWeek)
  }, [viewWeek, selectedId, fetchWeekMatches])

  async function handlePlayWeek() {
    if (!league) return
    const r = await api.post(`/api/leagues/${selectedId}/weeks/${league.current_week + 1}/play`)
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

  /* ── Empty state ── */
  if (leagues.length === 0 && !loading) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(60px,12vw,160px)', fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 0.85, color: 'var(--cream)', opacity: 0.04, marginBottom: 36, userSelect: 'none' }}>
          NO<br />LEAGUES
        </div>
        <p className="label" style={{ marginBottom: 20 }}>No leagues yet</p>
        <Link to="/leagues/new" className="btn-acid">Create First League</Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .dash-wrap  { max-width: 1280px; margin: 0 auto; width: 100%; }
        .dash-grid  { display: grid; grid-template-columns: minmax(0, 1fr) 300px; align-items: start; }
        .dash-viewport {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 56px - 48px);
          max-height: calc(100vh - 56px - 48px);
          overflow: hidden;
        }
        .dash-header { flex-shrink: 0; }
        .dash-grid-fill {
          flex: 1;
          min-height: 0;
          align-items: stretch;
        }
        .dash-left  { padding-right: 40px; border-right: 1px solid var(--border); min-width: 0; display: flex; flex-direction: column; min-height: 0; }
        .dash-left-scroll {
          flex: 1;
          min-height: 0;
        }
        .dash-right-scroll {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .dash-right { padding-left: 40px; display: flex; flex-direction: column; min-width: 0; min-height: 0; flex: 1; }
        @media (max-width: 900px) {
          .dash-viewport {
            min-height: 0;
            max-height: none;
            overflow: visible;
          }
          .dash-grid  { grid-template-columns: 1fr; }
          .dash-left  { padding-right: 0; border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 32px; margin-bottom: 32px; }
          .dash-right { padding-left: 0; }
          .dash-left-scroll,
          .dash-right-scroll {
            max-height: min(420px, 55vh);
            flex: none;
          }
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      {/* ── Top bar: league name + controls ── */}
      <div className="dash-viewport">
      <div className="dash-wrap dash-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        paddingTop: 24, paddingBottom: 20,
        borderBottom: '1px solid var(--border)', marginBottom: 28,
      }}>
        {/* Left: name + meta */}
        <div>
          <LeagueSelect
            leagues={leagues}
            value={selectedId}
            onChange={setSelectedId}
            variant="hero"
          />
          {league && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="label">Week {league.current_week} of {totalWeeks}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '2px 7px',
                background: allPlayed ? 'var(--pink)' : 'transparent',
                color: allPlayed ? 'var(--black)' : 'var(--acid)',
                border: allPlayed ? 'none' : '1px solid var(--acid)',
              }}>
                {allPlayed ? 'Season Complete' : 'Active'}
              </span>
              {loading && <div className="spin" />}
            </div>
          )}
        </div>

        {/* Right: action buttons */}
        {league && !allPlayed && (
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={handlePlayWeek} className="btn-acid">
              ▶ Play Week {nextWeek}
            </button>
            <button onClick={handlePlayAll} className="btn-outline">
              ▶▶ Play All
            </button>
          </div>
        )}
        {allPlayed && (
          <span style={{ fontSize: 11, color: 'var(--acid)', fontWeight: 600, letterSpacing: '0.05em' }}>
            🏆 Season finished
          </span>
        )}
      </div>

      {/* ── Main grid ── */}
      {league && (
        <div className="dash-wrap dash-grid dash-grid-fill">
          {/* Left: Standings */}
          <div className="dash-left">
            <div className="label" style={{ marginBottom: 14, flexShrink: 0 }}>Standings</div>
            <div className="dash-left-scroll scroll-y">
              <StandingsTable standings={standings} />
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="dash-right">
            <div className="dash-right-scroll scroll-y">
              <MatchBanner
                matches={weekMatches}
                totalWeeks={totalWeeks}
                viewWeek={viewWeek}
                setViewWeek={setViewWeek}
                isNextWeekView={isNextWeekView}
              />
              <StatsRotator
                scorers={topScorers}
                assists={topAssists}
                mostCards={mostCards}
                leagueId={selectedId}
                loading={statsLoading}
              />
              <PredictionWidget predictions={predictions} currentWeek={league.current_week} />
            </div>
          </div>
        </div>
      )}
      </div>

      {liveMatches && <LiveMatchModal matches={liveMatches} onClose={handleModalClose} />}
    </>
  )
}
