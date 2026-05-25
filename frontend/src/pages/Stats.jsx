import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { useReveal } from '../hooks/useReveal'

const LIST_INITIAL = 10
const LIST_STEP = 10

function StatListPanel({ rows, emptyText, children }) {
  const [limit, setLimit] = useState(LIST_INITIAL)

  useEffect(() => { setLimit(LIST_INITIAL) }, [rows])

  if (rows.length === 0) {
    return <p style={{ fontSize: 12, color: 'rgba(237,232,220,0.3)' }}>{emptyText}</p>
  }

  const visible = rows.slice(0, limit)
  const canExpand = limit < rows.length
  const canCollapse = limit > LIST_INITIAL

  return (
    <div>
      <div className="stat-list-scroll">
        {children(visible)}
      </div>
      {rows.length > LIST_INITIAL && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(237,232,220,0.3)', letterSpacing: '0.06em' }}>
            {visible.length} / {rows.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {canCollapse && (
              <button type="button" className="stat-list-btn" onClick={() => setLimit(LIST_INITIAL)}>
                Less
              </button>
            )}
            {canExpand && (
              <button type="button" className="stat-list-btn" onClick={() => setLimit(l => Math.min(l + LIST_STEP, rows.length))}>
                More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatSection({ title, accent, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div className="label" style={{ marginBottom: 16, color: accent }}>{title}</div>
      {children}
    </section>
  )
}

function GoalAssistTable({ rows, allRows, statKey, accent }) {
  const max = (allRows?.[0] ?? rows[0])?.[statKey] || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((p, i) => {
        const val = p[statKey]
        const pct = (val / max) * 100
        const isTop = i === 0
        return (
          <div key={`${p.player_name}-${p.team_name}-${i}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 10, color: 'rgba(237,232,220,0.25)', width: 16, flexShrink: 0 }}>{i + 1}</span>
                {p.crest_url
                  ? <img src={p.crest_url} alt="" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />
                  : <span style={{ width: 16, height: 16, background: 'var(--mid)', display: 'inline-block', flexShrink: 0 }} />
                }
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: isTop ? 14 : 12, fontWeight: isTop ? 700 : 400,
                    color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.55)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.player_name}</span>
                  <span style={{
                    display: 'block', fontSize: 10, color: 'rgba(237,232,220,0.25)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.team_name}</span>
                </div>
              </div>
              <span style={{
                fontSize: isTop ? 22 : 14, fontWeight: 700, color: isTop ? accent : 'rgba(237,232,220,0.35)',
                flexShrink: 0, marginLeft: 12,
              }}>{val}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }}>
              <div style={{ height: 1, width: `${pct}%`, background: isTop ? accent : 'rgba(237,232,220,0.1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DisciplineTable({ rows, allRows }) {
  const max = (allRows?.[0] ?? rows[0])?.total_cards || 1
  return (
    <div>
      <div className="stat-list-header" style={{
        display: 'grid', gridTemplateColumns: '1fr 48px 48px 56px',
        gap: 8, paddingBottom: 8, marginBottom: 8,
        borderBottom: '1px solid var(--border)',
        fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(237,232,220,0.25)',
      }}>
        <span>Player</span>
        <span style={{ textAlign: 'center' }}>🟨</span>
        <span style={{ textAlign: 'center' }}>🟥</span>
        <span style={{ textAlign: 'right' }}>Total</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((p, i) => {
          const pct = (p.total_cards / max) * 100
          const isTop = i === 0
          return (
            <div key={`${p.player_name}-${p.team_name}-${i}`}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 48px 48px 56px',
                gap: 8, alignItems: 'center', marginBottom: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: 'rgba(237,232,220,0.25)', width: 16, flexShrink: 0 }}>{i + 1}</span>
                  {p.crest_url
                    ? <img src={p.crest_url} alt="" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />
                    : <span style={{ width: 16, height: 16, background: 'var(--mid)', display: 'inline-block', flexShrink: 0 }} />
                  }
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: isTop ? 14 : 12, fontWeight: isTop ? 700 : 400,
                      color: isTop ? 'var(--cream)' : 'rgba(237,232,220,0.55)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{p.player_name}</span>
                    <span style={{
                      display: 'block', fontSize: 10, color: 'rgba(237,232,220,0.25)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{p.team_name}</span>
                  </div>
                </div>
                <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#f5c518' }}>{p.yellow_cards}</span>
                <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--pink)' }}>{p.red_cards}</span>
                <span style={{
                  textAlign: 'right', fontSize: isTop ? 18 : 13, fontWeight: 700,
                  color: isTop ? '#ff9f43' : 'rgba(237,232,220,0.35)',
                }}>{p.total_cards}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }}>
                <div style={{ height: 1, width: `${pct}%`, background: isTop ? '#ff9f43' : 'rgba(237,232,220,0.1)' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Stats() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [leagues, setLeagues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [scorers, setScorers] = useState([])
  const [assists, setAssists] = useState([])
  const [mostCards, setMostCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [headerRef, headerVisible] = useReveal()

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
    setLoading(true)
    Promise.allSettled([
      api.get(`/api/leagues/${selectedId}/top-scorers`),
      api.get(`/api/leagues/${selectedId}/top-assists`),
      api.get(`/api/leagues/${selectedId}/most-cards`),
    ])
      .then(([sc, as, mc]) => {
        setScorers(sc.status === 'fulfilled' ? (sc.value.data.data || []) : [])
        setAssists(as.status === 'fulfilled' ? (as.value.data.data || []) : [])
        setMostCards(mc.status === 'fulfilled' ? (mc.value.data.data || []) : [])
      })
      .finally(() => setLoading(false))
  }, [selectedId])

  const leagueName = leagues.find(l => l.id === selectedId)?.name

  return (
    <>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; align-items: start; }
        @media (max-width: 1100px) { .stats-grid { grid-template-columns: 1fr; gap: 40px; } }
        .stat-list-scroll {
          max-height: min(380px, 50vh);
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 6px;
          scrollbar-width: thin;
          scrollbar-color: rgba(237,232,220,0.15) transparent;
        }
        .stat-list-scroll::-webkit-scrollbar { width: 4px; }
        .stat-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(237,232,220,0.15);
          border-radius: 2px;
        }
        .stat-list-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: rgba(237,232,220,0.45);
          font-family: inherit;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .stat-list-btn:hover {
          color: var(--cream);
          border-color: rgba(237,232,220,0.25);
        }
      `}</style>

      <div ref={headerRef} className={`reveal ${headerVisible ? 'in' : ''}`} style={{ marginBottom: 56 }}>
        <div className="label" style={{ marginBottom: 10 }}>Season Records</div>
        <div style={{
          fontSize: 'clamp(40px,8vw,100px)', fontWeight: 700,
          letterSpacing: '-0.05em', lineHeight: 0.88, color: 'var(--cream)',
        }}>
          Stats
        </div>
        {leagues.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={selectedId || ''}
              onChange={e => setSelectedId(Number(e.target.value))}
              style={{
                background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                color: 'var(--cream)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em',
                fontFamily: 'inherit', padding: '0 0 4px', outline: 'none', cursor: 'pointer',
              }}
            >
              {leagues.map(l => (
                <option key={l.id} value={l.id} style={{ background: 'var(--dark)', fontSize: 14 }}>{l.name}</option>
              ))}
            </select>
            {loading && <div className="spin" />}
          </div>
        )}
      </div>

      {leagues.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: 'rgba(237,232,220,0.35)' }}>
          No leagues yet. Import or create one to track stats.
        </p>
      )}

      {selectedId && !loading && (
        <div className="stats-grid">
          <StatSection title={`${leagueName} · Goals`} accent="var(--pink)">
            <StatListPanel rows={scorers} emptyText="No goals recorded yet.">
              {visible => <GoalAssistTable rows={visible} allRows={scorers} statKey="goals" accent="var(--pink)" />}
            </StatListPanel>
          </StatSection>
          <StatSection title={`${leagueName} · Assists`} accent="var(--acid)">
            <StatListPanel rows={assists} emptyText="No assists recorded yet.">
              {visible => <GoalAssistTable rows={visible} allRows={assists} statKey="assists" accent="var(--acid)" />}
            </StatListPanel>
          </StatSection>
          <StatSection title={`${leagueName} · Discipline`} accent="#ff9f43">
            <StatListPanel rows={mostCards} emptyText="No cards recorded yet.">
              {visible => <DisciplineTable rows={visible} allRows={mostCards} />}
            </StatListPanel>
          </StatSection>
        </div>
      )}
    </>
  )
}
