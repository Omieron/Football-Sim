import { useEffect, useRef, useMemo } from 'react'
import { buildGoalScene, sampleScene } from '../utils/goalAnimation'

const TEAM = {
  home: { fill: '#d4ff00', stroke: '#a8cc00' },
  away: { fill: '#ff1f5a', stroke: '#cc1848' },
}

function drawPitch(ctx, w, h) {
  ctx.fillStyle = '#143d28'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(237,232,220,0.22)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(8, 8, w - 16, h - 16)

  ctx.beginPath()
  ctx.moveTo(w / 2, 8)
  ctx.lineTo(w / 2, h - 8)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(w / 2, h / 2, h * 0.12, 0, Math.PI * 2)
  ctx.stroke()

  ;[8, w - 8 - w * 0.18].forEach((x) => {
    ctx.strokeRect(x, h * 0.28, w * 0.18, h * 0.44)
  })
}

function toCanvas(x, y, w, h) {
  return {
    x: 8 + (x / 100) * (w - 16),
    y: 8 + (y / 100) * (h - 16),
  }
}

export default function GoalReplay({ event, match, onDone, compact = false }) {
  const canvasRef = useRef(null)
  const scene = useMemo(() => {
    if (event?.goal_replay) return event.goal_replay
    if (event && match) return buildGoalScene(event, match)
    return null
  }, [event, match])
  const rafRef = useRef(null)

  useEffect(() => {
    if (!scene || !canvasRef.current) return undefined

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight
    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const start = performance.now()
    const duration = scene.duration

    const actorMap = {}
    scene.actors.forEach((a) => { actorMap[a.key] = a })

    function frame(now) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / duration)
      const state = sampleScene(scene, progress)

      drawPitch(ctx, cssW, cssH)

      Object.entries(state.positions).forEach(([key, pos]) => {
        const actor = actorMap[key]
        if (!actor) return
        const { x, y } = toCanvas(pos.x, pos.y, cssW, cssH)
        const colors = TEAM[actor.team] || TEAM.home
        const r = actor.role === 'gk' ? 9 : actor.role === 'scorer' ? 8 : 7

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = colors.fill
        ctx.fill()
        ctx.strokeStyle = colors.stroke
        ctx.lineWidth = 1.5
        ctx.stroke()

        if (actor.label) {
          ctx.fillStyle = 'rgba(10,10,10,0.75)'
          ctx.font = '600 8px Space Grotesk, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(actor.label, x, y + r + 9)
        }
      })

      const ball = toCanvas(state.ball.x, state.ball.y, cssW, cssH)
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ede8dc'
      ctx.fill()
      ctx.strokeStyle = '#0a0a0a'
      ctx.lineWidth = 1
      ctx.stroke()

      if (progress >= 0.92) {
        ctx.fillStyle = 'rgba(255,31,90,0.15)'
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, 18, 0, Math.PI * 2)
        ctx.fill()
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else if (onDone) {
        setTimeout(onDone, compact ? 400 : 700)
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scene, onDone, compact])

  if (!scene) return null

  return (
    <div style={{
      marginBottom: compact ? 0 : 14,
      border: '1px solid var(--border)',
      background: 'rgba(0,0,0,0.35)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--acid)',
        }}>
          Goal replay · {event.minute}'
        </span>
        <span style={{ fontSize: 10, color: 'rgba(237,232,220,0.45)' }}>{scene.label}</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: compact ? 140 : 180, display: 'block' }}
      />
      <div style={{
        padding: '8px 12px', fontSize: 11, color: 'var(--cream)',
        borderTop: '1px solid var(--border)',
      }}>
        {scene.caption}
      </div>
    </div>
  )
}
