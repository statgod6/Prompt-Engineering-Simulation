import { useProgress } from '../hooks/useProgress'
import StatsPanel from '../components/StatsPanel'
import ModuleCard from '../components/ModuleCard'
import ProgressBar from '../components/ProgressBar'
import '../styles/Dashboard.css'

const partDefs = [
  { part: 1, title: 'Foundations', range: 'Modules 1–4', color: 'var(--accent)', gradient: 'linear-gradient(135deg, #58a6ff22, #58a6ff08)' },
  { part: 2, title: 'Intermediate', range: 'Modules 5–9', color: 'var(--accent-green)', gradient: 'linear-gradient(135deg, #3fb95022, #3fb95008)' },
  { part: 3, title: 'Advanced', range: 'Modules 10–14', color: 'var(--accent-purple)', gradient: 'linear-gradient(135deg, #bc8cff22, #bc8cff08)' },
  { part: 4, title: 'Expert', range: 'Modules 15–20', color: 'var(--accent-yellow)', gradient: 'linear-gradient(135deg, #d2992222, #d2992208)' },
]

function formatTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function scoreColor(score) {
  if (score >= 0.8) return 'var(--accent-green)'
  if (score >= 0.6) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

/* Circular progress ring */
function ProgressRing({ percent, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (percent / 100) * circ
  return (
    <svg className="progress-ring" width={size} height={size}>
      <circle className="progress-ring-bg" cx={size/2} cy={size/2} r={radius}
        strokeWidth={stroke} fill="none" />
      <circle className="progress-ring-fill" cx={size/2} cy={size/2} r={radius}
        strokeWidth={stroke} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="progress-ring-text">
        {percent}%
      </text>
    </svg>
  )
}

export default function Dashboard() {
  const { progress, loading } = useProgress()

  if (loading || !progress) {
    return (
      <div className="dashboard">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-stats" />
        <div className="skeleton skeleton-modules" />
        <div className="skeleton skeleton-modules" />
      </div>
    )
  }

  const user = progress.user ?? { username: 'Student', level: 1, streak: 0 }
  const stats = progress.stats ?? { modulesCompleted: 0, totalModules: 20, badges: 0, totalXp: 0 }
  const modules = progress.modules ?? []
  const recentActivity = progress.recentActivity ?? []
  const overallPercent = stats.totalModules
    ? Math.round((stats.modulesCompleted / stats.totalModules) * 100)
    : 0

  return (
    <div className="dashboard">
      {/* Hero Banner */}
      <section className="dash-hero">
        <div className="dash-hero-content">
          <div className="dash-hero-text">
            <h1>Welcome to <span className="hero-gradient-text">PromptLab</span></h1>
            <p className="dash-hero-tagline">Master Prompt Engineering Through Hands-On Simulations</p>
            <p className="dash-hero-sub">
              Level {user.level} &middot; {stats.modulesCompleted} of {stats.totalModules} modules completed
            </p>
          </div>
          <div className="dash-hero-ring">
            <ProgressRing percent={overallPercent} size={130} stroke={12} />
            <span className="ring-label">Overall Progress</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatsPanel stats={{ ...stats, streak: user.streak }} />

      {/* Course Parts */}
      <section className="course-parts">
        {partDefs.map(({ part, title, range, color, gradient }) => {
          const partModules = modules.filter((m) => m.part === part)
          if (partModules.length === 0) return null
          const completed = partModules.filter(m => m.status === 'completed').length
          return (
            <div key={part} className="part-section">
              <h3 className="part-header">
                <span className="part-tag" style={{ background: color }}>Part {part}</span>
                <span className="part-title-text">{title}</span>
                <span className="part-range">{range}</span>
                <span className="part-completion" style={{ color }}>{completed}/{partModules.length} done</span>
              </h3>
              <div className="modules-grid">
                {partModules.map((mod) => (
                  <ModuleCard key={mod.id} module={mod} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* Recent Activity Timeline */}
      {recentActivity && recentActivity.length > 0 && (
        <section className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-timeline">
            {recentActivity.slice(0, 5).map((a, i) => (
              <div key={a.id} className="timeline-item">
                <div className="timeline-dot" style={{ background: scoreColor(a.score) }} />
                {i < Math.min(recentActivity.length, 5) - 1 && <div className="timeline-line" />}
                <div className="timeline-content">
                  <span className="activity-module">{a.module}</span>
                  <div className="timeline-meta">
                    <span className="activity-model">{a.model}</span>
                    <span className="activity-score" style={{ color: scoreColor(a.score) }}>
                      {Math.round(a.score * 100)}%
                    </span>
                    <span className="activity-time">{formatTimeAgo(a.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="dash-footer">
        <span>Made with ✦ by <strong>Abhinav Verma</strong></span>
      </footer>
    </div>
  )
}
