export function eventIcon(type) {
  switch (type) {
    case 'goal': return '⚽'
    case 'own_goal': return '😬'
    case 'yellow_card': return '🟨'
    case 'red_card': return '🟥'
    case 'offside': return '🚩'
    case 'substitution': return '🔄'
    case 'var_cancelled_goal': return '📺'
    case 'injury': return '🏥'
    default: return '·'
  }
}

export function eventTypeLabel(type) {
  switch (type) {
    case 'goal': return 'Gol'
    case 'own_goal': return 'Kendi kalesine'
    case 'yellow_card': return 'Sarı kart'
    case 'red_card': return 'Kırmızı kart'
    case 'offside': return 'Ofsayt'
    case 'substitution': return 'Oyuncu değişikliği'
    case 'var_cancelled_goal': return 'VAR — Gol iptal'
    case 'injury': return 'Sakatlık'
    default: return type
  }
}

export function isGoalEvent(e) {
  return e.type === 'goal' || e.type === 'own_goal'
}

export function eventDescription(e, match) {
  const team = e.team_name || ''
  switch (e.type) {
    case 'own_goal': {
      const benefited = e.team_id === match.home_team_id ? match.away_team_name : match.home_team_name
      return { primary: e.player_name, secondary: `KK · ${benefited}` }
    }
    case 'goal':
      if (e.assist_player_name) {
        return { primary: e.player_name, secondary: `Asist: ${e.assist_player_name}` }
      }
      return { primary: e.player_name, secondary: team }
    case 'substitution':
      return { primary: `${e.player_name} ↔ ${e.assist_player_name}`, secondary: team }
    case 'var_cancelled_goal':
      return { primary: e.player_name, secondary: 'Ofsayt / VAR inceleme' }
    case 'offside':
      return { primary: e.player_name, secondary: team }
    case 'injury':
      return { primary: e.player_name, secondary: `${team} · oyundan çıktı` }
    case 'yellow_card':
    case 'red_card':
      return { primary: e.player_name, secondary: team }
    default:
      return { primary: e.player_name || team, secondary: team }
  }
}

export function scoresFromEvent(e, match) {
  if (e.type === 'goal') {
    return e.team_id === match.home_team_id ? { home: 1, away: 0 } : { home: 0, away: 1 }
  }
  if (e.type === 'own_goal') {
    return e.team_id === match.home_team_id ? { home: 0, away: 1 } : { home: 1, away: 0 }
  }
  return { home: 0, away: 0 }
}

export function sortEvents(events) {
  const order = {
    goal: 0,
    var_cancelled_goal: 1,
    own_goal: 2,
    yellow_card: 3,
    red_card: 4,
    substitution: 5,
    offside: 6,
    injury: 7,
  }
  return [...events].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute
    return (order[a.type] ?? 9) - (order[b.type] ?? 9)
  })
}
