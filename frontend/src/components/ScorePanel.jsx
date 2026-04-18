import { useState } from 'react'
import '../styles/SimulationWorkspace.css'

const DIMENSION_LABELS = {
  accuracy: 'Accuracy',
  format_compliance: 'Format Compliance',
  consistency: 'Consistency',
  efficiency: 'Efficiency',
  robustness: 'Robustness',
}

function ScoreBar({ label, value }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.7 ? 'var(--accent-green)' : value >= 0.5 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  return (
    <div className="score-panel__bar-row">
      <span className="score-panel__bar-label">{label}</span>
      <div className="score-panel__bar-track">
        <div
          className="score-panel__bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="score-panel__bar-value" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function ScorePanel({ score, passThreshold = 0.7, loading = false }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (loading) {
    return (
      <div className="score-panel">
        <div className="score-panel__loading">
          <div className="score-panel__spinner" />
          <span>Evaluating...</span>
        </div>
      </div>
    )
  }

  if (!score) {
    return (
      <div className="score-panel">
        <div className="score-panel__empty">
          Run your prompt and evaluation results will appear here
        </div>
      </div>
    )
  }

  const composite = score.composite ?? 0
  const passed = score.passed ?? composite >= passThreshold
  const compositeColor = composite >= 0.7 ? 'var(--accent-green)' : composite >= 0.5 ? 'var(--accent-yellow)' : 'var(--accent-red)'
  const compositePct = Math.round(composite * 100)

  return (
    <div className="score-panel">
      <div className="score-panel__header">
        <span className="score-panel__title">Evaluation</span>
        <span
          className={`score-panel__badge ${passed ? 'score-panel__badge--pass' : 'score-panel__badge--fail'}`}
        >
          {passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>

      <div className="score-panel__composite">
        <span className="score-panel__composite-value" style={{ color: compositeColor }}>
          {compositePct}
        </span>
        <span className="score-panel__composite-unit">%</span>
        <div className="score-panel__composite-label">Composite Score</div>
        <div className="score-panel__threshold">
          Pass threshold: {Math.round(passThreshold * 100)}%
        </div>
      </div>

      <div className="score-panel__message" style={{ color: compositeColor }}>
        {passed ? 'Passed! Great work!' : 'Not yet — keep trying!'}
      </div>

      {score.scores && (
        <div className="score-panel__dimensions">
          {Object.entries(score.scores).map(([key, val]) => (
            <ScoreBar
              key={key}
              label={DIMENSION_LABELS[key] || key.replace(/_/g, ' ')}
              value={val}
            />
          ))}
        </div>
      )}

      {score.details && (
        <>
          <button
            className="score-panel__details-toggle"
            onClick={() => setDetailsOpen(o => !o)}
            type="button"
          >
            {detailsOpen ? '▾ Hide Details' : '▸ Show Details'}
          </button>
          {detailsOpen && (
            <div className="score-panel__details">
              {score.details.map((d, i) => (
                <div
                  key={i}
                  className={`score-panel__detail-row ${d.passed ? 'score-panel__detail-row--pass' : 'score-panel__detail-row--fail'}`}
                >
                  <span className="score-panel__detail-num">#{i + 1}</span>
                  <span className="score-panel__detail-input">{d.input?.slice(0, 60) || 'Test case'}</span>
                  <span className="score-panel__detail-score">{Math.round((d.score ?? 0) * 100)}%</span>
                  <span className="score-panel__detail-icon">{d.passed ? '✓' : '✕'}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
