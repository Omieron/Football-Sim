export default function TeamCard({ team, onClick }) {
  return (
    <div
      onClick={() => onClick?.(team)}
      className="rounded-lg p-4 cursor-pointer transition-colors flex flex-col gap-3"
      style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}
    >
      <div className="flex items-center gap-3">
        {team.crest_url ? (
          <img src={team.crest_url} alt="" className="w-10 h-10 object-contain" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: '#2d2d4e', color: '#2ec4b6' }}>
            {team.name?.[0]}
          </div>
        )}
        <div>
          <div className="font-semibold text-slate-200">{team.name}</div>
          <div className="text-xs" style={{ color: '#64748b' }}>{team.short_name}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#64748b' }}>Attack</span>
            <span style={{ color: '#f59e0b' }}>{team.attack}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: '#2d2d4e' }}>
            <div className="h-1.5 rounded-full" style={{ width: `${team.attack}%`, backgroundColor: '#f59e0b' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#64748b' }}>Defense</span>
            <span style={{ color: '#3b82f6' }}>{team.defense}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: '#2d2d4e' }}>
            <div className="h-1.5 rounded-full" style={{ width: `${team.defense}%`, backgroundColor: '#3b82f6' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
