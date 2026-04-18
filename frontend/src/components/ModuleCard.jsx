import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'

const partColors = {
  1: 'var(--accent)',       // blue
  2: 'var(--accent-green)', // green
  3: 'var(--accent-purple)', // purple
  4: 'var(--accent-yellow)', // orange/yellow
}

export default function ModuleCard({ module }) {
  const { id, number, title, part, status, bestScore, passThreshold, locked } = module
  const color = partColors[part] || 'var(--accent)'
  const scorePercent = Math.round(bestScore * 100)
  const thresholdPercent = Math.round(passThreshold * 100)

  const isCompleted = status === 'completed'
  const isAvailable = status === 'available'

  const cardContent = (
    <div
      className={`module-card ${locked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
      style={isCompleted ? { borderColor: 'var(--accent-green)' } : undefined}
    >
      {/* Module number badge */}
      <span className="module-badge" style={{ background: color }}>
        {number}
      </span>

      {/* Title */}
      <h4 className="module-title">{title}</h4>

      {/* Status */}
      <div className="module-status">
        {locked && (
          <span className="status-locked">
            {'\uD83D\uDD12'} Complete Module {number - 1} first
          </span>
        )}
        {isAvailable && bestScore === 0 && (
          <span className="status-available">Ready to start</span>
        )}
        {isAvailable && bestScore > 0 && (
          <span className="status-progress">In progress</span>
        )}
        {isCompleted && (
          <span className="status-completed">
            {'\u2713'} Completed — {scorePercent}%
          </span>
        )}
      </div>

      {/* Score progress bar (if attempted) */}
      {bestScore > 0 && (
        <div className="module-score">
          <div className="score-bar-container">
            <ProgressBar
              value={scorePercent}
              color={isCompleted ? 'var(--accent-green)' : 'var(--accent)'}
              height={6}
            />
            {/* Pass threshold indicator */}
            <div
              className="threshold-line"
              style={{ left: `${thresholdPercent}%` }}
              title={`Pass: ${thresholdPercent}%`}
            />
          </div>
        </div>
      )}
    </div>
  )

  if (locked) {
    return <div className="module-card-wrapper locked">{cardContent}</div>
  }

  return (
    <Link to={`/modules/${id}`} className="module-card-wrapper">
      {cardContent}
    </Link>
  )
}
