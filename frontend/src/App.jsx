import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Fixtures from './pages/Fixtures'
import Teams from './pages/Teams'
import NewLeague from './pages/NewLeague'
import Import from './pages/Import'
import Stats from './pages/Stats'

export default function App() {
  return (
    <BrowserRouter>
      {/* Abstract blobs */}
      <div style={{
        position: 'fixed', top: '-15vh', right: '-8vw',
        width: '55vw', height: '55vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,31,90,0.12) 0%, transparent 65%)',
        filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10vh', left: '-5vw',
        width: '40vw', height: '40vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,255,0,0.07) 0%, transparent 65%)',
        filter: 'blur(110px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Navbar />
        <main style={{ padding: '0 12px 48px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/leagues/new" element={<NewLeague />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
