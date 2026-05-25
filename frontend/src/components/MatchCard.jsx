export default function MatchCard({ match, onEdit }) {
  const { home_team_name, away_team_name, home_crest_url, away_crest_url, home_goals, away_goals, played } = match

  return (
    <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}>
      {/* Home */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-sm font-medium text-slate-200 text-right">{home_team_name}</span>
        {home_crest_url ? (
          <img src={home_crest_url} alt="" className="w-6 h-6 object-contain" />
        ) : (
          <div className="w-6 h-6 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: '#2d2d4e' }}>
            {home_team_name?.[0]}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-center w-20">
        {played ? (
          <span className="text-lg font-bold" style={{ color: '#2ec4b6' }}>
            {home_goals} – {away_goals}
          </span>
        ) : (
          <span className="text-slate-500 text-sm">vs</span>
        )}
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 flex-1 justify-start">
        {away_crest_url ? (
          <img src={away_crest_url} alt="" className="w-6 h-6 object-contain" />
        ) : (
          <div className="w-6 h-6 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: '#2d2d4e' }}>
            {away_team_name?.[0]}
          </div>
        )}
        <span className="text-sm font-medium text-slate-200">{away_team_name}</span>
      </div>

      {/* Edit */}
      {played && onEdit && (
        <button
          onClick={() => onEdit(match)}
          className="text-xs px-2 py-1 rounded ml-2 transition-colors"
          style={{ backgroundColor: '#2d2d4e', color: '#94a3b8' }}
        >
          Edit
        </button>
      )}
    </div>
  )
}
