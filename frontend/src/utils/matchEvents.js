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
    case 'goal': return 'Goal'
    case 'own_goal': return 'Own goal'
    case 'yellow_card': return 'Yellow card'
    case 'red_card': return 'Red card'
    case 'offside': return 'Offside'
    case 'substitution': return 'Substitution'
    case 'var_cancelled_goal': return 'VAR — Goal disallowed'
    case 'injury': return 'Injury'
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
      return { primary: e.player_name, secondary: `OG · ${benefited}` }
    }
    case 'goal':
      if (e.assist_player_name) {
        return { primary: e.player_name, secondary: `Assist: ${e.assist_player_name}` }
      }
      return { primary: e.player_name, secondary: team }
    case 'substitution':
      return { primary: `${e.player_name} ↔ ${e.assist_player_name}`, secondary: team }
    case 'var_cancelled_goal':
      return { primary: e.player_name, secondary: 'Offside / VAR review' }
    case 'offside':
      return { primary: e.player_name, secondary: team }
    case 'injury':
      return { primary: e.player_name, secondary: `${team} · subbed off` }
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

export function formatMinute(minute) {
  if (minute <= 90) return `${minute}'`
  if (minute <= 99) return `90+${minute - 90}'`
  if (minute >= 101) return `ET ${minute - 100}'`
  return `${minute}'`
}

export function scoreAtMinute(events, match, upToMinute) {
  let home = 0
  let away = 0
  for (const e of events) {
    if (e.minute > upToMinute) break
    const d = scoresFromEvent(e, match)
    home += d.home
    away += d.away
  }
  return { home, away }
}

export function maxEventMinute(events) {
  if (!events.length) return 90
  return Math.max(90, ...events.map(e => e.minute))
}

/** Inserts a half-time row into chronological match feed. */
export function buildTimeline(events, match, halftimeReached = false) {
  const sorted = sortEvents(events)
  const ht = scoreAtMinute(sorted, match, 45)
  const out = []
  let htInserted = false

  for (const e of sorted) {
    if (!htInserted && e.minute > 45) {
      out.push({
        type: 'half_time',
        minute: 45,
        homeScore: ht.home,
        awayScore: ht.away,
        synthetic: true,
      })
      htInserted = true
    }
    out.push(e)
  }

  if (!htInserted && halftimeReached && sorted.some(e => e.minute <= 45)) {
    out.push({
      type: 'half_time',
      minute: 45,
      homeScore: ht.home,
      awayScore: ht.away,
      synthetic: true,
    })
  }

  return out
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
