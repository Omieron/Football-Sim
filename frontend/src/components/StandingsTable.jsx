export default function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return <p className="text-slate-500 text-sm">No standings yet.</p>
  }

  const total = standings.length

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #2d2d4e' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#1a1a2e', color: '#64748b' }}>
            <th className="px-3 py-2 text-left w-8">#</th>
            <th className="px-3 py-2 text-left">Team</th>
            <th className="px-3 py-2 text-center">P</th>
            <th className="px-3 py-2 text-center">W</th>
            <th className="px-3 py-2 text-center">D</th>
            <th className="px-3 py-2 text-center">L</th>
            <th className="px-3 py-2 text-center">GF</th>
            <th className="px-3 py-2 text-center">GA</th>
            <th className="px-3 py-2 text-center">GD</th>
            <th className="px-3 py-2 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const rank = i + 1
            let accentColor = 'transparent'
            if (rank <= 4) accentColor = '#22c55e'
            else if (rank > total - 3) accentColor = '#ef4444'

            return (
              <tr
                key={s.team_id}
                style={{ borderTop: '1px solid #2d2d4e', backgroundColor: i % 2 === 0 ? '#0d0d18' : '#0a0a0f' }}
              >
                <td className="px-3 py-2 relative">
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="pl-2 text-slate-400">{rank}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {s.crest_url ? (
                      <img src={s.crest_url} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#2d2d4e' }}>
                        {s.team_name?.[0]}
                      </div>
                    )}
                    <span className="font-medium text-slate-200">{s.team_name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center text-slate-400">{s.played}</td>
                <td className="px-3 py-2 text-center text-slate-400">{s.won}</td>
                <td className="px-3 py-2 text-center text-slate-400">{s.drawn}</td>
                <td className="px-3 py-2 text-center text-slate-400">{s.lost}</td>
                <td className="px-3 py-2 text-center text-slate-400">{s.goals_for}</td>
                <td className="px-3 py-2 text-center text-slate-400">{s.goals_against}</td>
                <td className="px-3 py-2 text-center text-slate-400">{s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                <td className="px-3 py-2 text-center font-bold" style={{ color: '#2ec4b6' }}>{s.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex gap-4 px-3 py-2 text-xs" style={{ borderTop: '1px solid #2d2d4e', color: '#64748b' }}>
        <span><span className="inline-block w-2 h-2 rounded mr-1" style={{ backgroundColor: '#22c55e' }} />Champions League</span>
        <span><span className="inline-block w-2 h-2 rounded mr-1" style={{ backgroundColor: '#ef4444' }} />Relegation</span>
      </div>
    </div>
  )
}
