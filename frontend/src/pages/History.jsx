import { useState, useMemo } from 'react'
import HistoryTable from '../components/HistoryTable'
import { useHistory } from '../hooks/useHistory'
import '../styles/ComparisonHistory.css'

const MODULES = [
  'What is Prompt Engineering', 'Anatomy of a Good Prompt', 'Zero-Shot & Few-Shot',
  'Role & Persona Prompting', 'Output Formatting', 'Chain of Thought',
  'Instruction Decomposition', 'Prompt Templates', 'Handling Ambiguity', 'Self-Consistency',
]

const MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
]

export default function History() {
  const [moduleFilter, setModuleFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [scoreMin, setScoreMin] = useState(0)
  const [scoreMax, setScoreMax] = useState(1)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  const filters = useMemo(() => ({
    module: moduleFilter || undefined,
    model: modelFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    scoreMin: scoreMin > 0 ? scoreMin : undefined,
    scoreMax: scoreMax < 1 ? scoreMax : undefined,
  }), [moduleFilter, modelFilter, dateFrom, dateTo, scoreMin, scoreMax])

  const { runs, loading, totalCount, page, setPage } = useHistory(filters)

  const sortedRuns = useMemo(() => {
    const sorted = [...runs]
    sorted.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (sortBy === 'date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    return sorted
  }, [runs, sortBy, sortOrder])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const totalPages = Math.ceil(totalCount / 10) || 1

  const handleExport = () => {
    alert('CSV export coming soon!')
  }

  return (
    <div className="history-page">
      <div className="history-page__header">
        <h1 className="page-title">Run History</h1>
        <button className="btn" onClick={handleExport}>Export CSV</button>
      </div>

      {/* Filter Bar */}
      <div className="history-filters card">
        <div className="history-filter">
          <label>Module</label>
          <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1) }}>
            <option value="">All Modules</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="history-filter">
          <label>Model</label>
          <select value={modelFilter} onChange={(e) => { setModelFilter(e.target.value); setPage(1) }}>
            <option value="">All Models</option>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="history-filter">
          <label>From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
        </div>
        <div className="history-filter">
          <label>To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
        </div>
        <div className="history-filter history-filter--score">
          <label>Score: {scoreMin.toFixed(1)} – {scoreMax.toFixed(1)}</label>
          <div className="history-filter__range">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={scoreMin}
              onChange={(e) => { setScoreMin(+e.target.value); setPage(1) }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={scoreMax}
              onChange={(e) => { setScoreMax(+e.target.value); setPage(1) }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="history-loading">Loading history...</div>
      ) : runs.length === 0 ? (
        <div className="history-empty card">
          <span className="history-empty__icon">📜</span>
          <p>No runs yet. Start a simulation to see your history here.</p>
        </div>
      ) : (
        <>
          <HistoryTable
            runs={sortedRuns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {/* Pagination */}
          <div className="history-pagination">
            <button
              className="btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <div className="history-pagination__pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`history-pagination__page ${p === page ? 'history-pagination__page--active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
