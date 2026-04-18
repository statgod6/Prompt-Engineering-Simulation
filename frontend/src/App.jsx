import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import ModuleView from './pages/ModuleView'
import SimulationWorkspace from './pages/SimulationWorkspace'
import Leaderboard from './pages/Leaderboard'
import ComparisonView from './pages/ComparisonView'
import History from './pages/History'
import DuelArena from './pages/DuelArena'
import CapstoneGallery from './pages/CapstoneGallery'

/* ===== Navigation Items ===== */
const navItems = [
  { to: '/',            label: 'Dashboard',   icon: '📊' },
  { to: '/modules/1',   label: 'Modules',     icon: '📦' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/history',     label: 'History',     icon: '📜' },
  { to: '/compare',     label: 'Compare',     icon: '⚖️' },
  { to: '/duel',        label: 'Duel Arena',  icon: '⚔️' },
  { to: '/capstone',    label: 'Capstone',    icon: '🎓' },
]

/* ===== App Component ===== */
export default function App() {
  const { sidebarOpen, toggleSidebar, setSidebar, theme, toggleTheme } = useApp()
  const location = useLocation()

  const closeSidebar = () => setSidebar(false)

  return (
    <div className="app-layout">
      {/* Hamburger toggle (mobile) */}
      <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
        ☰
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">⚡</span>
            PromptLab
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (window.innerWidth < 768) closeSidebar()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="sidebar-branding">Made by Abhinav Verma</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/"                          element={<Dashboard />} />
          <Route path="/modules/:id"               element={<ModuleView />} />
          <Route path="/modules/:id/simulation"    element={<SimulationWorkspace />} />
          <Route path="/history"                   element={<History />} />
          <Route path="/compare"                   element={<ComparisonView />} />
          <Route path="/leaderboard"               element={<Leaderboard />} />
          <Route path="/duel"                      element={<DuelArena />} />
          <Route path="/capstone"                  element={<CapstoneGallery />} />
        </Routes>
      </main>
    </div>
  )
}
