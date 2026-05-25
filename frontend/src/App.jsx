import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Fixtures from './pages/Fixtures'
import Teams from './pages/Teams'
import NewLeague from './pages/NewLeague'
import Import from './pages/Import'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f', color: '#e2e8f0' }}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/leagues/new" element={<NewLeague />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
