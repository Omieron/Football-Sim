import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/teams', label: 'Squads' },
  { to: '/leagues/new', label: 'New League' },
  { to: '/import', label: 'Import' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [hovered, setHovered] = useState(null)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(237,232,220,0.08)',
    }}>
      <div style={{
        padding: '0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em',
            color: 'var(--pink)', lineHeight: 1,
          }}>FS</span>
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(237,232,220,0.35)',
          }}>Football Sim</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {links.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                onMouseEnter={() => setHovered(to)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  textDecoration: 'none',
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--acid)' : hovered === to ? 'var(--cream)' : 'rgba(237,232,220,0.4)',
                  transition: 'color 0.15s',
                  position: 'relative',
                }}
              >
                {label}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: 14, right: 14,
                    height: 1, background: 'var(--acid)',
                  }} />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
