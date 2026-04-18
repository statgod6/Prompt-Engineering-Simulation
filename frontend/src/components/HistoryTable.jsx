import { useState } from 'react'
import '../styles/ComparisonHistory.css'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function truncate(str, len = 50) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function scoreColor(score) {
  if (score >= 0.7) return 'var(--accent-green)'
  if (score >= 0.5) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

export default function HistoryTable({ runs, sortBy, sortOrder, onSort, onRunClick }) {
  const [expandedId, setExpandedId] = useState(null)

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'module', label: 'Module' },
    { key: 'simulation', label: 'Simulation' },
    { key: 'model_name', label: 'Model' },
    { key: 'prompt', label: 'Prompt' },
    { key: 'score', label: 'Score' },
    { key: 'tokens_total', label: 'Tokens' },
    { key: 'cost', label: 'Cost' },
  ]

  const sortArrow = (key) => {
    if (sortBy !== key) return ''
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  const handleRowClick = (run) => {
    setExpandedId(expandedId === run.id ? null : run.id)
    onRunClick?.(run)
  }

  return (
    <div className="history-table-wrapper">
      <table className="history-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="history-table__th"
                onClick={() => onSort?.(col.key)}
                style={{ cursor: 'pointer' }}
              >
                {col.label}{sortArrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <>
              <tr
                key={run.id}
                className={`history-table__row ${expandedId === run.id ? 'history-table__row--expanded' : ''}`}
                onClick={() => handleRowClick(run)}
              >
                <td className="history-table__td">
                  <div>{formatDate(run.date)}</div>
                  <div className="history-table__time">{formatTime(run.date)}</div>
                </td>
                <td className="history-table__td">{run.module}</td>
                <td className="history-table__td">{run.simulation}</td>
                <td className="history-table__td">{run.model_name}</td>
                <td className="history-table__td history-table__td--prompt">{truncate(run.prompt)}</td>
                <td className="history-table__td">
                  <span style={{ color: scoreColor(run.score), fontWeight: 600 }}>
                    {run.score?.toFixed(2) ?? '—'}
                  </span>
                </td>
                <td className="history-table__td">{run.tokens_total}</td>
                <td className="history-table__td">${run.cost?.toFixed(4) ?? '—'}</td>
              </tr>
              {expandedId === run.id && (
                <tr key={`${run.id}-detail`} className="history-table__detail-row">
                  <td colSpan={columns.length} className="history-table__detail-cell">
                    <div className="history-detail">
                      <div className="history-detail__section">
                        <h4>Prompt</h4>
                        <pre className="history-detail__text">{run.prompt}</pre>
                      </div>
                      <div className="history-detail__section">
                        <h4>Output</h4>
                        <pre className="history-detail__text">{run.output}</pre>
                      </div>
                      <div className="history-detail__params">
                        <h4>Parameters</h4>
                        <div className="history-detail__param-grid">
                          <span>Temperature: {run.temperature}</span>
                          <span>Max Tokens: {run.max_tokens}</span>
                          <span>Top P: {run.top_p}</span>
                          <span>Freq Penalty: {run.frequency_penalty}</span>
                          <span>Presence Penalty: {run.presence_penalty}</span>
                          <span>Response Time: {run.response_time}ms</span>
                        </div>
                      </div>
                      <div className="history-detail__actions">
                        <a
                          href={`/modules/${run.module_id}/simulation`}
                          className="btn btn-primary history-detail__replay"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Replay
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
