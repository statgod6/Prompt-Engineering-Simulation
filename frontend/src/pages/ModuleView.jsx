import { useParams, Link, useNavigate } from 'react-router-dom'
import { useModule } from '../hooks/useModule'
import ConceptRenderer from '../components/ConceptRenderer'
import '../styles/ModuleView.css'

const TOTAL_MODULES = 20

function formatTime(seconds) {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatScore(score) {
  return `${Math.round(score * 100)}%`
}

function formatType(type) {
  return (type || 'build_to_spec').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/* ===== Loading Skeleton ===== */
function ModuleSkeleton() {
  return (
    <div className="module-view">
      <div className="module-skeleton">
        <div className="skeleton-pulse skeleton-header" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div className="skeleton-pulse skeleton-content" />
          <div className="skeleton-pulse skeleton-sidebar" />
        </div>
      </div>
    </div>
  )
}

/* ===== Main Component ===== */
export default function ModuleView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { module: mod, simulation, concept, loading, error } = useModule(id)

  if (loading) return <ModuleSkeleton />

  if (error || !mod) {
    return (
      <div className="module-view">
        <div className="module-error">
          <span className="module-error-icon">⚠️</span>
          <h2>Failed to load module</h2>
          <p>{error?.message || 'Module not found'}</p>
          <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const numId = Number(id)
  const hasPrev = numId > 1
  const hasNext = numId < TOTAL_MODULES
  const passThreshold = mod.passThreshold ?? 0.7
  const bestScore = mod.bestScore ?? 0
  const isCompleted = mod.status === 'completed'
  const hasBestScore = bestScore > 0
  const passed = bestScore >= passThreshold

  return (
    <div className="module-view">
      {/* ===== Header ===== */}
      <div className="module-header">
        <div className="module-header-top">
          <div className="module-header-left">
            <span className={`part-badge part-${mod.part}`}>
              Part {mod.part} — {mod.partTitle || ''}
            </span>
            <span className="pass-threshold">
              Pass: ≥{Math.round(passThreshold * 100)}%
            </span>
          </div>
          <div className="module-nav-buttons">
            <Link
              to={hasPrev ? `/modules/${numId - 1}` : '#'}
              className={`module-nav-btn ${!hasPrev ? 'disabled' : ''}`}
              onClick={e => !hasPrev && e.preventDefault()}
            >
              ← Previous
            </Link>
            <Link
              to={hasNext ? `/modules/${numId + 1}` : '#'}
              className={`module-nav-btn ${!hasNext ? 'disabled' : ''}`}
              onClick={e => !hasNext && e.preventDefault()}
            >
              Next →
            </Link>
          </div>
        </div>

        <h1 className="module-title">
          Module {mod.number ?? '?'}: {mod.title || 'Untitled'}
        </h1>

        {hasBestScore && (
          <div className="module-header-meta">
            <span className={`best-score ${passed ? 'passed' : 'failed'}`}>
              {passed ? '✓' : '✗'} Best: {formatScore(bestScore)}
            </span>
          </div>
        )}
      </div>

      {/* ===== Body: Content + Sidebar ===== */}
      <div className="module-body">
        {/* Concept Content */}
        <div className="module-content">
          <ConceptRenderer content={concept} />
        </div>

        {/* Sidebar */}
        <aside className="module-sidebar">
          {/* Simulation Card */}
          {simulation && (
            <div className="sim-card">
              <div className="sim-card-header">
                <span className="sim-title">{simulation.title}</span>
                <span className={`sim-type-badge type-${simulation.type}`}>
                  {formatType(simulation.type)}
                </span>
              </div>
              <p className="sim-instructions">{simulation.instructions}</p>
              <div className="sim-meta">
                <span className="sim-meta-item">🎯 {simulation.testCaseCount} test cases</span>
                <span className="sim-meta-item">🤖 {simulation.default_model?.split('/').pop()}</span>
              </div>
              <div className="sim-actions">
                <Link to={`/modules/${id}/simulation`} className="btn-start-sim">
                  {isCompleted ? '🔄 Retry Simulation' : '🚀 Start Simulation'}
                </Link>
              </div>
              {isCompleted && hasBestScore && (
                <div className="sim-best-score">
                  <span className="sim-best-score-label">Best Score</span>
                  <span className="sim-best-score-value">{formatScore(bestScore)}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats Card */}
          <div className="stats-card">
            <h3 className="stats-card-title">Module Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Attempts</span>
                <span className="stat-value">{mod.attempts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Best Score</span>
                <span className="stat-value">{hasBestScore ? formatScore(bestScore) : '—'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Spent</span>
                <span className="stat-value">{formatTime(mod.timeSpent)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className="stat-value" style={{ textTransform: 'capitalize' }}>{mod.status}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
