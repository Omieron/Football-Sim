export default function TeamCard({ team, onClick, selected }) {
  return (
    <button
      type="button"
      className={`squads-team-item${selected ? ' is-selected' : ''}`}
      onClick={() => onClick?.(team)}
    >
      {team.crest_url
        ? <img src={team.crest_url} alt="" className="squads-team-crest" />
        : <span className="squads-team-crest squads-team-crest-fallback">{team.name?.[0]}</span>
      }
      <div className="squads-team-info">
        <span className="squads-team-name">{team.name}</span>
        {team.short_name && <span className="squads-team-short">{team.short_name}</span>}
      </div>
      <div className="squads-team-ratings">
        <span className="squads-team-atk">{team.attack}</span>
        <span className="squads-team-def">{team.defense}</span>
      </div>
    </button>
  )
}
