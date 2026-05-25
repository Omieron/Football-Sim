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

function templateCornerTop(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'corner_top', label: 'Korner (kafa)', duration: 3400, keyframes: [
    { t: 0, ball: A(94, 10), positions: { assister: A(93, 8), scorer: A(84, 46), def1: A(86, 38), def2: A(88, 52), gk: A(94, 50) } },
    { t: 0.42, ball: A(88, 38), positions: { assister: A(93, 10), scorer: A(85, 44), def1: A(87, 40), def2: A(89, 50), gk: A(93, 49) } },
    { t: 1, ball: A(92, 48), positions: { assister: A(93, 12), scorer: A(88, 48), def1: A(89, 44), def2: A(90, 52), gk: A(89, 49) } },
  ]}
}

function templateCornerBottom(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'corner_bottom', label: 'Korner (kafa)', duration: 3400, keyframes: [
    { t: 0, ball: A(94, 90), positions: { assister: A(93, 92), scorer: A(84, 54), def1: A(86, 62), def2: A(88, 48), gk: A(94, 50) } },
    { t: 0.42, ball: A(88, 62), positions: { assister: A(93, 90), scorer: A(85, 52), def1: A(87, 58), def2: A(89, 50), gk: A(93, 51) } },
    { t: 1, ball: A(92, 52), positions: { assister: A(93, 88), scorer: A(88, 52), def1: A(89, 54), def2: A(90, 48), gk: A(89, 51) } },
  ]}
}

function templateThroughBall(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'through_ball', label: 'Ara pas', duration: 3000, keyframes: [
    { t: 0, ball: A(58, 50), positions: { assister: A(56, 50), scorer: A(72, 44), def1: A(64, 48), def2: A(66, 54), gk: A(94, 50) } },
    { t: 0.72, ball: A(86, 46), positions: { assister: A(60, 52), scorer: A(84, 46), def1: A(76, 47), def2: A(78, 51), gk: A(91, 50) } },
    { t: 1, ball: A(91, 47), positions: { assister: A(62, 52), scorer: A(87, 47), def1: A(80, 48), def2: A(82, 50), gk: A(88, 49) } },
  ]}
}

function templateCutback(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'cutback', label: 'Geri pas & gol', duration: 3200, keyframes: [
    { t: 0, ball: A(90, 22), positions: { assister: A(88, 20), scorer: A(82, 50), def1: A(86, 30), def2: A(84, 48), gk: A(94, 50) } },
    { t: 1, ball: A(91, 49), positions: { assister: A(90, 32), scorer: A(86, 49), def1: A(89, 42), def2: A(87, 51), gk: A(89, 50) } },
  ]}
}

function templateLowCross(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'low_cross', label: 'Yerden orta', duration: 3300, keyframes: [
    { t: 0, ball: A(78, 82), positions: { assister: A(76, 84), scorer: A(86, 50), def1: A(80, 72), def2: A(84, 54), gk: A(94, 50) } },
    { t: 1, ball: A(91, 50), positions: { assister: A(78, 80), scorer: A(88, 50), def1: A(84, 58), def2: A(86, 51), gk: A(89, 50) } },
  ]}
}

function templatePenalty(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'penalty', label: 'Penaltı', duration: 2800, keyframes: [
    { t: 0, ball: A(84, 50), positions: { scorer: A(78, 50), def1: A(86, 46), gk: A(94, 50) } },
    { t: 0.35, ball: A(84, 50), positions: { scorer: A(82, 50), def1: A(86, 46), gk: A(93, 48) } },
    { t: 1, ball: A(92, 46), positions: { scorer: A(84, 48), def1: A(86, 46), gk: A(90, 44) } },
  ]}
}

function templateFreeKick(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'free_kick', label: 'Serbest vuruş', duration: 3200, keyframes: [
    { t: 0, ball: A(70, 52), positions: { scorer: A(68, 52), def1: A(76, 48), def2: A(76, 54), gk: A(94, 50) } },
    { t: 1, ball: A(92, 43), positions: { scorer: A(71, 54), def1: A(78, 50), def2: A(78, 52), gk: A(88, 44) } },
  ]}
}

function templateVolley(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'volley', label: 'Vole', duration: 2600, keyframes: [
    { t: 0, ball: A(82, 38), positions: { scorer: A(80, 46), def1: A(84, 42), def2: A(86, 50), gk: A(94, 50) } },
    { t: 1, ball: A(91, 48), positions: { scorer: A(82, 48), def1: A(86, 44), def2: A(88, 50), gk: A(89, 47) } },
  ]}
}

function templateTapIn(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'tap_in', label: 'Boş ağ', duration: 2200, keyframes: [
    { t: 0, ball: A(88, 50), positions: { scorer: A(86, 50), def1: A(84, 48), gk: A(94, 51) } },
    { t: 1, ball: A(92, 50), positions: { scorer: A(89, 50), def1: A(86, 50), gk: A(91, 50) } },
  ]}
}

function templateLeftChannel(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'left_channel', label: 'Sol kanat', duration: 3100, keyframes: [
    { t: 0, ball: A(62, 28), positions: { scorer: A(62, 28), def1: A(68, 32), def2: A(70, 44), gk: A(94, 50) } },
    { t: 1, ball: A(91, 40), positions: { scorer: A(87, 40), def1: A(80, 40), def2: A(82, 46), gk: A(89, 47) } },
  ]}
}

function templateRightChannel(attackRight) {
  const A = (x, y) => pt(x, y, attackRight)
  return { id: 'right_channel', label: 'Sağ kanat', duration: 3100, keyframes: [
    { t: 0, ball: A(62, 72), positions: { scorer: A(62, 72), def1: A(68, 68), def2: A(70, 56), gk: A(94, 50) } },
    { t: 1, ball: A(91, 60), positions: { scorer: A(87, 60), def1: A(80, 60), def2: A(82, 54), gk: A(89, 53) } },
  ]}
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

function pickAssistedMethod(rng) {
  const r = rng()
  if (r < 0.18) return 'counter'
  if (r < 0.36) return 'wide_cross'
  if (r < 0.50) return 'through_ball'
  if (r < 0.62) return 'corner_top'
  if (r < 0.74) return 'corner_bottom'
  if (r < 0.87) return 'low_cross'
  return 'cutback'
}

function pickSoloMethod(rng) {
  const r = rng()
  if (r < 0.22) return 'solo'
  if (r < 0.40) return 'long_shot'
  if (r < 0.55) return 'left_channel'
  if (r < 0.70) return 'right_channel'
  if (r < 0.82) return 'volley'
  return 'tap_in'
}

function pickGoalMethod(rng, eventType, assistName) {
  if (eventType === 'own_goal') return 'own_goal'
  if (assistName) {
    const assisted = [
      'counter', 'wide_cross', 'corner_top', 'corner_bottom',
      'through_ball', 'cutback', 'low_cross',
    ]
    return assisted[Math.floor(rng() * assisted.length)]
  }
  const r = rng()
  if (r < 0.06) return 'penalty'
  if (r < 0.11) return 'free_kick'
  return rng() < 0.55 ? pickAssistedMethod(rng) : pickSoloMethod(rng)
}

function templateByMethod(method, attackRight) {
  const map = {
    own_goal: templateOwnGoal,
    penalty: templatePenalty,
    free_kick: templateFreeKick,
    corner_top: templateCornerTop,
    corner_bottom: templateCornerBottom,
    solo: templateSolo,
    long_shot: templateLongShot,
    volley: templateVolley,
    tap_in: templateTapIn,
    left_channel: templateLeftChannel,
    right_channel: templateRightChannel,
    counter: templateCounter,
    wide_cross: templateWideCross,
    through_ball: templateThroughBall,
    cutback: templateCutback,
    low_cross: templateLowCross,
  }
  return (map[method] || templateSolo)(attackRight)
}

export function buildGoalScene(event, match) {
  const rng = mulberry32(seed(event))

  const scoringTeam = event.type === 'goal'
    ? event.team_id
    : (event.team_id === match.home_team_id ? match.away_team_id : match.home_team_id)

  const attackRight = scoringTeam === match.home_team_id
  const method = pickGoalMethod(rng, event.type, event.assist_player_name || '')
  const tpl = templateByMethod(method, attackRight)

  const actors = buildActors(event, match, attackRight)
  const hasAssist = event.type === 'goal' && !!event.assist_player_name

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
