export default function PredictionWidget({ predictions }) {
  if (!predictions || predictions.length === 0) return null

  const sorted = [...predictions].sort((a, b) => (b.percentage ?? b.championship_probability) - (a.percentage ?? a.championship_probability))

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2d2d4e' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#2ec4b6' }}>Championship Predictions</h3>
      <div className="flex flex-col gap-2">
        {sorted.map((p) => {
          const pct = p.percentage ?? p.championship_probability ?? 0
          return (
            <div key={p.team_id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{p.team_name}</span>
                <span className="font-semibold" style={{ color: '#2ec4b6' }}>{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: '#2d2d4e' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: '#2ec4b6' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
