import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/teams', label: 'Teams' },
  { to: '/leagues/new', label: 'New League' },
  { to: '/import', label: 'Import' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{ backgroundColor: '#1a1a2e', borderBottom: '1px solid #2d2d4e' }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 h-14">
        <span className="font-bold text-lg tracking-wide" style={{ color: '#2ec4b6' }}>
          ⚽ FootballSim
        </span>
        <div className="flex gap-6">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium transition-colors"
              style={{ color: pathname === to ? '#2ec4b6' : '#94a3b8' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
