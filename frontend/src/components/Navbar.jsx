import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import BrandMark from './BrandMark'
import { BRAND } from '../config/brand'

const mainLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/stats', label: 'Stats' },
  { to: '/teams', label: 'Squads' },
]

const actionLinks = [
  { to: '/leagues/new', label: 'New League' },
  { to: '/import', label: 'Import' },
]

function isActive(pathname, to, end) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

export default function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <Link to="/" className="app-nav-brand" onClick={() => setMenuOpen(false)}>
          <BrandMark className="app-nav-mark" />
          <span className="app-nav-brand-text">
            <span className="app-nav-brand-name">{BRAND.name}</span>
            <span className="app-nav-brand-tag">{BRAND.tagline}</span>
          </span>
        </Link>

        <button
          type="button"
          className={`app-nav-toggle${menuOpen ? ' is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span />
          <span />
        </button>

        <div className={`app-nav-panel${menuOpen ? ' is-open' : ''}`}>
          <nav className="app-nav-links" aria-label="Main">
            {mainLinks.map(({ to, label, end }) => {
              const active = isActive(pathname, to, end)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`app-nav-link${active ? ' is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="app-nav-actions">
            {actionLinks.map(({ to, label }) => {
              const active = isActive(pathname, to, false)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`app-nav-action${active ? ' is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <div className="app-nav-rule" aria-hidden="true" />
    </header>
  )
}
