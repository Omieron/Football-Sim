export default function LeagueSelect({
  leagues,
  value,
  onChange,
  label = 'League',
  variant = 'default',
}) {
  if (leagues.length === 0) return null

  if (leagues.length === 1) {
    if (variant === 'hero') {
      return (
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--cream)', marginBottom: 6 }}>
          {leagues[0].name}
        </div>
      )
    }
    return (
      <div className="league-select-wrap">
        <span className="label">{label}</span>
        <span className="league-select-name">{leagues[0].name}</span>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <select
        className="league-select-hero"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
      >
        {leagues.map(l => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
    )
  }

  return (
    <div className="league-select-wrap">
      <label className="label" htmlFor="league-select">{label}</label>
      <select
        id="league-select"
        className="league-select"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
      >
        {leagues.map(l => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
    </div>
  )
}
