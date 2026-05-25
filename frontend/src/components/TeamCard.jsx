import { useState } from 'react'

export default function TeamCard({ team, onClick, selected }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onClick?.(team)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px',
        border: selected
          ? '1px solid var(--acid)'
          : hovered
          ? '1px solid rgba(237,232,220,0.25)'
          : '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'scale(1.02) rotate(0.3deg)' : 'scale(1)',
        background: selected ? 'rgba(212,255,0,0.04)' : 'transparent',
      }}
    >
      {/* Big background initial */}
      <span style={{
        position: 'absolute', right: -8, top: -16,
        fontSize: 96, fontWeight: 700, lineHeight: 1,
        color: 'rgba(237,232,220,0.03)',
        letterSpacing: '-0.05em',
        userSelect: 'none', pointerEvents: 'none',
      }}>{team.name?.[0]}</span>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        {team.crest_url
          ? <img src={team.crest_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
          : <div style={{
              width: 32, height: 32, background: 'var(--mid)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'rgba(237,232,220,0.3)', flexShrink: 0,
            }}>{team.name?.[0]}</div>
        }
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{team.name}</div>
          {team.short_name && (
            <div className="label" style={{ marginTop: 3 }}>{team.short_name}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'ATK', value: team.attack, color: 'var(--pink)' },
          { label: 'DEF', value: team.defense, color: 'var(--acid)' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="label">{label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }}>
              <div style={{
                height: 1, background: color, width: `${value}%`,
                transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
