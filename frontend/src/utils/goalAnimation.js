/** Procedural goal replay from existing match event (no backend changes). */

function seed(event) {
  return (event.minute * 7919 + (event.player_id || 0) * 17 + (event.team_id || 0)) >>> 0
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function mirrorX(x, attackRight) {
  return attackRight ? x : 100 - x
}

function pt(x, y, attackRight) {
  return { x: mirrorX(x, attackRight), y }
}

function buildActors(event, match, attackRight) {
  const scoringTeam = event.type === 'goal'
    ? event.team_id
    : (event.team_id === match.home_team_id ? match.away_team_id : match.home_team_id)

  const isHome = scoringTeam === match.home_team_id
  const team = isHome ? 'home' : 'away'
  const opp = isHome ? 'away' : 'home'

  const short = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return parts.length > 1 ? parts[parts.length - 1].slice(0, 8) : name.slice(0, 8)
  }

  const actors = [
    { key: 'scorer', team, label: short(event.player_name), role: 'scorer' },
  ]

  if (event.type === 'goal' && event.assist_player_name) {
    actors.unshift({ key: 'assister', team, label: short(event.assist_player_name), role: 'assister' })
  }

  actors.push(
    { key: 'def1', team: opp, label: '', role: 'def' },
    { key: 'def2', team: opp, label: '', role: 'def' },
    { key: 'gk', team: opp, label: 'GK', role: 'gk' },
  )

  return actors
}

function templateCounter(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return {
    id: 'counter',
    label: 'Kontra atak',
    duration: 3200,
    keyframes: [
      {
        t: 0,
        ball: A(38, 52),
        positions: {
          assister: A(36, 52),
          scorer: A(58, 44),
          def1: A(48, 58),
          def2: A(52, 38),
          gk: A(94, 50),
        },
      },
      {
        t: 0.38,
        ball: A(58, 46),
        positions: {
          assister: A(40, 54),
          scorer: A(60, 46),
          def1: A(50, 56),
          def2: A(54, 42),
          gk: A(93, 48),
        },
      },
      {
        t: 0.72,
        ball: A(78, 48),
        positions: {
          assister: A(42, 55),
          scorer: A(76, 48),
          def1: A(62, 52),
          def2: A(68, 44),
          gk: A(92, 50),
        },
      },
      {
        t: 1,
        ball: A(91, 49),
        positions: {
          assister: A(44, 56),
          scorer: A(84, 49),
          def1: A(72, 50),
          def2: A(76, 46),
          gk: A(90, 51),
        },
      },
    ],
  }
}

function templateWideCross(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return {
    id: 'wide_cross',
    label: 'Orta & bitiriş',
    duration: 3600,
    keyframes: [
      {
        t: 0,
        ball: A(72, 18),
        positions: {
          assister: A(70, 16),
          scorer: A(78, 52),
          def1: A(74, 28),
          def2: A(80, 48),
          gk: A(94, 50),
        },
      },
      {
        t: 0.45,
        ball: A(80, 42),
        positions: {
          assister: A(72, 18),
          scorer: A(79, 50),
          def1: A(76, 32),
          def2: A(81, 46),
          gk: A(93, 49),
        },
      },
      {
        t: 0.78,
        ball: A(86, 50),
        positions: {
          assister: A(73, 20),
          scorer: A(85, 50),
          def1: A(78, 38),
          def2: A(82, 48),
          gk: A(91, 51),
        },
      },
      {
        t: 1,
        ball: A(91, 50),
        positions: {
          assister: A(74, 22),
          scorer: A(87, 50),
          def1: A(80, 42),
          def2: A(84, 49),
          gk: A(89, 50),
        },
      },
    ],
  }
}

function templateSolo(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return {
    id: 'solo',
    label: 'Solo dripling',
    duration: 3000,
    keyframes: [
      {
        t: 0,
        ball: A(55, 50),
        positions: {
          scorer: A(55, 50),
          def1: A(62, 44),
          def2: A(64, 56),
          gk: A(94, 50),
        },
      },
      {
        t: 0.4,
        ball: A(68, 46),
        positions: {
          scorer: A(68, 46),
          def1: A(66, 44),
          def2: A(70, 52),
          gk: A(93, 49),
        },
      },
      {
        t: 0.75,
        ball: A(82, 48),
        positions: {
          scorer: A(82, 48),
          def1: A(74, 46),
          def2: A(76, 52),
          gk: A(91, 50),
        },
      },
      {
        t: 1,
        ball: A(91, 49),
        positions: {
          scorer: A(86, 49),
          def1: A(78, 48),
          def2: A(80, 51),
          gk: A(89, 50),
        },
      },
    ],
  }
}

function templateLongShot(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return {
    id: 'long_shot',
    label: 'Uzaktan şut',
    duration: 2800,
    keyframes: [
      {
        t: 0,
        ball: A(62, 50),
        positions: {
          scorer: A(61, 50),
          def1: A(70, 46),
          def2: A(72, 54),
          gk: A(94, 50),
        },
      },
      {
        t: 0.55,
        ball: A(78, 48),
        positions: {
          scorer: A(63, 51),
          def1: A(72, 47),
          def2: A(74, 53),
          gk: A(92, 49),
        },
      },
      {
        t: 1,
        ball: A(91, 47),
        positions: {
          scorer: A(64, 52),
          def1: A(74, 48),
          def2: A(76, 52),
          gk: A(88, 48),
        },
      },
    ],
  }
}

function templateOwnGoal(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return {
    id: 'own_goal',
    label: 'Kendi kalesine',
    duration: 2600,
    keyframes: [
      {
        t: 0,
        ball: A(88, 52),
        positions: {
          scorer: A(89, 52),
          def1: A(82, 48),
          gk: A(94, 50),
        },
      },
      {
        t: 0.5,
        ball: A(92, 50),
        positions: {
          scorer: A(91, 50),
          def1: A(84, 49),
          gk: A(93, 50),
        },
      },
      {
        t: 1,
        ball: A(95, 50),
        positions: {
          scorer: A(92, 50),
          def1: A(86, 50),
          gk: A(90, 50),
        },
      },
    ],
  }
}

export function buildGoalScene(event, match) {
  const rng = mulberry32(seed(event))

  const scoringTeam = event.type === 'goal'
    ? event.team_id
    : (event.team_id === match.home_team_id ? match.away_team_id : match.home_team_id)

  const attackRight = scoringTeam === match.home_team_id
  const hasAssist = event.type === 'goal' && !!event.assist_player_name

  let tpl
  if (event.type === 'own_goal') {
    tpl = templateOwnGoal(attackRight)
  } else if (hasAssist) {
    tpl = pick(rng, [templateCounter, templateWideCross])(attackRight)
  } else {
    tpl = pick(rng, [templateSolo, templateLongShot])(attackRight)
  }

  const actors = buildActors(event, match, attackRight)

  return {
    ...tpl,
    actors,
    attackRight,
    event,
    caption: event.type === 'own_goal'
      ? `${event.player_name} (OG) · ${tpl.label}`
      : hasAssist
        ? `${event.player_name} · ${event.assist_player_name} · ${tpl.label}`
        : `${event.player_name} · ${tpl.label}`,
  }
}

export function sampleScene(scene, progress) {
  const kfs = scene.keyframes
  const p = Math.max(0, Math.min(1, progress))
  let i = 0
  while (i < kfs.length - 2 && kfs[i + 1].t < p) i++

  const a = kfs[i]
  const b = kfs[Math.min(i + 1, kfs.length - 1)]
  const span = b.t - a.t || 1
  const local = (p - a.t) / span
  const t = local * local * (3 - 2 * local) // smoothstep

  const lerp = (x, y) => x + (y - x) * t

  const ball = {
    x: lerp(a.ball.x, b.ball.x),
    y: lerp(a.ball.y, b.ball.y),
  }

  const positions = {}
  const keys = new Set([...Object.keys(a.positions || {}), ...Object.keys(b.positions || {})])
  keys.forEach((key) => {
    const pa = a.positions?.[key]
    const pb = b.positions?.[key] || pa
    if (!pa) return
    positions[key] = { x: lerp(pa.x, pb.x), y: lerp(pa.y, pb.y) }
  })

  return { ball, positions, progress: p }
}
