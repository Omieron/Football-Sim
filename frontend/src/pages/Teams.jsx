import { useState, useEffect, useMemo } from 'react'
import api from '../api/axios'
import TeamCard from '../components/TeamCard'
import { useReveal } from '../hooks/useReveal'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']
const POS_LABELS = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' }

const EMPTY_TEAM_FORM = { name: '', short_name: '', crest_url: '', attack: 75, defense: 75 }
const EMPTY_PLAYER_FORM = { name: '', position: 'FWD' }

function FormModal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="scroll-y modal-panel squads-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="squads-modal-head">
          <span className="label">{title}</span>
          <button type="button" className="squads-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [players, setPlayers] = useState([])
  const [query, setQuery] = useState('')
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM)
  const [playerForm, setPlayerForm] = useState(EMPTY_PLAYER_FORM)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [headerRef, headerVisible] = useReveal()

  useEffect(() => {
    api.get('/api/teams').then(r => {
      const list = r.data.data || []
      setTeams(list)
      if (list.length > 0) selectTeam(list[0])
    })
  }, [])

  const filteredTeams = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teams
    return teams.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.short_name?.toLowerCase().includes(q)
    )
  }, [teams, query])

  function selectTeam(team) {
    setSelected(team)
    api.get(`/api/teams/${team.id}/players`).then(r => setPlayers(r.data.data || []))
  }

  async function createTeam(e) {
    e.preventDefault()
    setCreatingTeam(true)
    try {
      const r = await api.post('/api/teams', {
        ...teamForm,
        attack: Number(teamForm.attack),
        defense: Number(teamForm.defense),
      })
      const created = r.data.data
      setTeams(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setTeamForm(EMPTY_TEAM_FORM)
      setShowTeamModal(false)
      selectTeam(created)
    } finally {
      setCreatingTeam(false)
    }
  }

  async function addPlayer(e) {
    e.preventDefault()
    if (!selected) return
    setAddingPlayer(true)
    try {
      const r = await api.post(`/api/teams/${selected.id}/players`, playerForm)
      setPlayers(prev => [...prev, r.data.data])
      setPlayerForm(EMPTY_PLAYER_FORM)
      setShowPlayerModal(false)
    } finally {
      setAddingPlayer(false)
    }
  }

  const grouped = POSITIONS.reduce((acc, pos) => {
    acc[pos] = players.filter(p => p.position === pos)
    return acc
  }, {})

  const totalPlayers = players.length

  return (
    <div className="squads-page">
      <header ref={headerRef} className={`squads-hero reveal ${headerVisible ? 'in' : ''}`}>
        <div className="squads-hero-top">
          <div>
            <span className="label" style={{ display: 'block', marginBottom: 10 }}>Club Directory</span>
            <h1 className="squads-title">Squads</h1>
          </div>
          <button type="button" className="btn-outline squads-add-btn" onClick={() => setShowTeamModal(true)}>
            + Add Team
          </button>
        </div>
        <div className="squads-hero-meta">
          <span className="label">
            {teams.length} clubs
            {selected ? ` · ${totalPlayers} players in ${selected.short_name || selected.name}` : ''}
          </span>
          <input
            type="search"
            className="squads-search"
            placeholder="Search clubs…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="squads-layout">
        <aside className="squads-sidebar">
          <div className="squads-sidebar-head">
            <span className="label">Clubs</span>
            <span className="squads-sidebar-count">{filteredTeams.length}</span>
          </div>
          <div className="squads-sidebar-list scroll-y">
            {filteredTeams.map(t => (
              <TeamCard
                key={t.id}
                team={t}
                onClick={selectTeam}
                selected={selected?.id === t.id}
              />
            ))}
            {filteredTeams.length === 0 && (
              <p className="squads-empty-hint">
                {query ? 'No clubs match your search.' : 'No teams yet. Add one to get started.'}
              </p>
            )}
          </div>
        </aside>

        <main className="squads-detail">
          {!selected ? (
            <div className="squads-detail-empty">
              <span className="label">Select a club</span>
              <p>Pick a team from the list to browse its squad.</p>
            </div>
          ) : (
            <>
              <div className="squads-detail-head">
                <div className="squads-detail-identity">
                  {selected.crest_url
                    ? <img src={selected.crest_url} alt="" className="squads-detail-crest" />
                    : <span className="squads-detail-crest squads-detail-crest-fallback">{selected.name?.[0]}</span>
                  }
                  <div>
                    <h2 className="squads-detail-name">{selected.name}</h2>
                    {selected.short_name && <span className="label">{selected.short_name}</span>}
                  </div>
                </div>
                <div className="squads-detail-actions">
                  <div className="squads-stat-pills">
                    <div className="squads-stat-pill">
                      <span className="label">Attack</span>
                      <strong style={{ color: 'var(--pink)' }}>{selected.attack}</strong>
                      <div className="squads-stat-bar"><div style={{ width: `${selected.attack}%`, background: 'var(--pink)' }} /></div>
                    </div>
                    <div className="squads-stat-pill">
                      <span className="label">Defense</span>
                      <strong style={{ color: 'var(--acid)' }}>{selected.defense}</strong>
                      <div className="squads-stat-bar"><div style={{ width: `${selected.defense}%`, background: 'var(--acid)' }} /></div>
                    </div>
                  </div>
                  <button type="button" className="btn-acid squads-add-player-btn" onClick={() => setShowPlayerModal(true)}>
                    + Add Player
                  </button>
                </div>
              </div>

              <div className="squads-roster-head">
                <span className="label">Squad · {totalPlayers} players</span>
              </div>

              <div className="squads-roster scroll-y">
                {totalPlayers === 0 ? (
                  <p className="squads-empty-hint">No players in this squad yet.</p>
                ) : (
                  <div className="squads-roster-grid">
                    {POSITIONS.map(pos => grouped[pos].length > 0 && (
                      <section key={pos} className="squads-pos-block">
                        <div className="squads-pos-head">
                          <span className="squads-pos-code">{pos}</span>
                          <span className="squads-pos-label">{POS_LABELS[pos]}</span>
                          <span className="squads-pos-count">{grouped[pos].length}</span>
                        </div>
                        <ul className="squads-player-list">
                          {grouped[pos].map(p => (
                            <li key={p.id} className="squads-player-row">
                              <span className="squads-player-name">{p.name}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {showTeamModal && (
        <FormModal title="New Team" onClose={() => setShowTeamModal(false)}>
          <form onSubmit={createTeam} className="squads-form">
            <label className="squads-field">
              <span className="label">Team name</span>
              <input
                required
                placeholder="e.g. Manchester City"
                value={teamForm.name}
                onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                className="editorial-input"
              />
            </label>
            <label className="squads-field">
              <span className="label">Short name</span>
              <input
                placeholder="e.g. MCI"
                value={teamForm.short_name}
                onChange={e => setTeamForm(f => ({ ...f, short_name: e.target.value }))}
                className="editorial-input"
              />
            </label>
            <label className="squads-field">
              <span className="label">Crest URL</span>
              <input
                placeholder="https://…"
                value={teamForm.crest_url}
                onChange={e => setTeamForm(f => ({ ...f, crest_url: e.target.value }))}
                className="editorial-input"
              />
            </label>
            <label className="squads-field">
              <div className="squads-range-head">
                <span className="label">Attack</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink)' }}>{teamForm.attack}</span>
              </div>
              <input
                type="range" min="1" max="100" value={teamForm.attack}
                onChange={e => setTeamForm(f => ({ ...f, attack: e.target.value }))}
                className="squads-range squads-range-atk"
              />
            </label>
            <label className="squads-field">
              <div className="squads-range-head">
                <span className="label">Defense</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--acid)' }}>{teamForm.defense}</span>
              </div>
              <input
                type="range" min="1" max="100" value={teamForm.defense}
                onChange={e => setTeamForm(f => ({ ...f, defense: e.target.value }))}
                className="squads-range squads-range-def"
              />
            </label>
            <button type="submit" disabled={creatingTeam} className="btn-acid squads-form-submit">
              {creatingTeam ? 'Creating…' : 'Create Team'}
            </button>
          </form>
        </FormModal>
      )}

      {showPlayerModal && selected && (
        <FormModal title={`Add Player · ${selected.name}`} onClose={() => setShowPlayerModal(false)}>
          <form onSubmit={addPlayer} className="squads-form">
            <label className="squads-field">
              <span className="label">Player name</span>
              <input
                required
                placeholder="e.g. Erling Haaland"
                value={playerForm.name}
                onChange={e => setPlayerForm(f => ({ ...f, name: e.target.value }))}
                className="editorial-input"
              />
            </label>
            <label className="squads-field">
              <span className="label">Position</span>
              <select
                className="squads-select"
                value={playerForm.position}
                onChange={e => setPlayerForm(f => ({ ...f, position: e.target.value }))}
              >
                {POSITIONS.map(p => <option key={p} value={p}>{POS_LABELS[p]}</option>)}
              </select>
            </label>
            <button type="submit" disabled={addingPlayer} className="btn-acid squads-form-submit">
              {addingPlayer ? 'Adding…' : 'Add to Squad'}
            </button>
          </form>
        </FormModal>
      )}
    </div>
  )
}
