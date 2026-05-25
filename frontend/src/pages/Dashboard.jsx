import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import StandingsTable from '../components/StandingsTable'
import PredictionWidget from '../components/PredictionWidget'
import LiveMatchModal from '../components/LiveMatchModal'
import { useReveal } from '../hooks/useReveal'

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

/* ── Top scorers ────────────────────────────────────────── */
function TopScorers({ leagueId }) {
  const [scorers, setScorers] = useState([])
  const [ref, visible] = useReveal()

  useEffect(() => {
    if (!leagueId) return
    api.get(`/api/leagues/${leagueId}/top-scorers`)
      .then(r => setScorers(r.data.data || []))
      .catch(() => setScorers([]))
  }, [leagueId])

  if (scorers.length === 0) return null
  const max = scorers[0]?.goals || 1

  return (
    <div ref={ref} className={`reveal ${visible ? 'in' : ''}`}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 14 }}>
        <span className="label">Top Scorers</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {scorers.map((s, i) => {
          const isTop = i === 0
          const pct = (s.goals / max) * 100
          return (
            <div key={`${s.player_name}-${i}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  {s.crest_url
                    ? <img src={s.crest_url} alt="" style={{ width: 13, height: 13, objectFit: 'contain', flexShrink: 0 }} />
                    : <span style={{ width: 13, height: 13, background: 'var(--mid)', display: 'inline-block', flexShrink: 0 }} />
                  }
                  <span style={{
                    fontSize: isTop ? 13 : 11, fontWeight: isTop ? 700 : 400,
                    color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.5)',
                    letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{s.player_name}</span>
                </div>
                <span style={{
                  fontSize: isTop ? 20 : 13, fontWeight: 700, letterSpacing: '-0.04em',
                  color: isTop ? 'var(--pink)' : 'rgba(237,232,220,0.3)',
                  lineHeight: 1, flexShrink: 0, marginLeft: 8,
                }}>{s.goals}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }}>
                <div style={{ height: 1, width: `${pct}%`, background: isTop ? 'var(--pink)' : 'rgba(237,232,220,0.12)', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          )
        })}
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
        .dash-grid  { display: grid; grid-template-columns: 1fr 300px; }
        .dash-left  { padding-right: 40px; border-right: 1px solid var(--border); }
        .dash-right { padding-left: 40px; display: flex; flex-direction: column; gap: 32px; }
        @media (max-width: 900px) {
          .dash-grid  { grid-template-columns: 1fr; }
          .dash-left  { padding-right: 0; border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 32px; margin-bottom: 32px; }
          .dash-right { padding-left: 0; }
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        paddingTop: 24, paddingBottom: 20,
        borderBottom: '1px solid var(--border)', marginBottom: 28,
      }}>
        {/* Left: name + meta */}
        <div>
          {leagues.length > 1 ? (
            <select value={selectedId || ''} onChange={e => setSelectedId(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--cream)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: 'inherit', padding: '0 0 4px', outline: 'none', cursor: 'pointer', marginBottom: 6 }}>
              {leagues.map(l => <option key={l.id} value={l.id} style={{ background: 'var(--dark)', fontSize: 14, fontWeight: 400 }}>{l.name}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--cream)', marginBottom: 6 }}>
              {league?.name || '—'}
            </div>
          )}
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
        <div className="dash-grid">
          {/* Left: Standings */}
          <div className="dash-left">
            <div className="label" style={{ marginBottom: 14 }}>Standings</div>
            <StandingsTable standings={standings} />
          </div>

          {/* Right: sidebar */}
          <div className="dash-right">
            <MatchBanner
              matches={weekMatches}
              totalWeeks={totalWeeks}
              viewWeek={viewWeek}
              setViewWeek={setViewWeek}
              isNextWeekView={isNextWeekView}
            />
            <TopScorers leagueId={selectedId} />
            {predictions.length > 0 && <PredictionWidget predictions={predictions} />}
          </div>
        </div>
      )}

      {liveMatches && <LiveMatchModal matches={liveMatches} onClose={handleModalClose} />}
    </>
  )
}
