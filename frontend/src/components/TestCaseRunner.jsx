import { useState, useCallback } from 'react'
import '../styles/SimulationWorkspace.css'

export default function TestCaseRunner({ testCases = [], prompt, model, params, onComplete }) {
  const [expanded, setExpanded] = useState(false)
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(-1)

  const runAllTests = useCallback(async () => {
    if (!testCases.length || running) return
    setRunning(true)
    setResults([])
    const allResults = []

    for (let i = 0; i < testCases.length; i++) {
      setCurrentIdx(i)
      const tc = testCases[i]
      try {
        // Simulate test run — in production this calls the API
        await new Promise(resolve => setTimeout(resolve, 800))
        const passed = Math.random() > 0.3
        const score = passed ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5
        allResults.push({ index: i, status: passed ? 'pass' : 'fail', score })
      } catch {
        allResults.push({ index: i, status: 'fail', score: 0 })
      }
      setResults([...allResults])
    }

    setCurrentIdx(-1)
    setRunning(false)
    onComplete?.(allResults)
  }, [testCases, running, prompt, model, params, onComplete])

  const completed = results.length
  const total = testCases.length
  const passCount = results.filter(r => r.status === 'pass').length
  const passRate = completed > 0 ? Math.round((passCount / completed) * 100) : 0

  const getStatusIcon = (idx) => {
    if (idx === currentIdx) return '⟳'
    const result = results.find(r => r.index === idx)
    if (!result) return '○'
    return result.status === 'pass' ? '✓' : '✕'
  }

  const getStatusClass = (idx) => {
    if (idx === currentIdx) return 'tcr__status--running'
    const result = results.find(r => r.index === idx)
    if (!result) return 'tcr__status--pending'
    return result.status === 'pass' ? 'tcr__status--pass' : 'tcr__status--fail'
  }

  if (!testCases.length) return null

  return (
    <div className={`tcr ${expanded ? 'tcr--expanded' : ''}`}>
      <button
        className="tcr__toggle"
        onClick={() => setExpanded(e => !e)}
        type="button"
      >
        <span className="tcr__toggle-label">
          Test Cases ({completed}/{total})
        </span>
        {completed > 0 && (
          <span className="tcr__pass-rate">
            {passRate}% pass rate
          </span>
        )}
        <span className="tcr__toggle-arrow">{expanded ? '▾' : '▴'}</span>
      </button>

      {expanded && (
        <div className="tcr__body">
          <div className="tcr__toolbar">
            <button
              className="tcr__run-all"
              onClick={runAllTests}
              disabled={running}
              type="button"
            >
              {running ? 'Running...' : 'Run All Tests'}
            </button>
            {total > 0 && (
              <div className="tcr__progress-bar">
                <div
                  className="tcr__progress-fill"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="tcr__list">
            {testCases.map((tc, idx) => (
              <div key={idx} className="tcr__row">
                <span className="tcr__num">#{idx + 1}</span>
                <span className="tcr__input">
                  {(tc.input || tc.description || JSON.stringify(tc)).slice(0, 80)}
                </span>
                <span className={`tcr__status ${getStatusClass(idx)}`}>
                  {getStatusIcon(idx)}
                </span>
                {results.find(r => r.index === idx) && (
                  <span className="tcr__score">
                    {Math.round((results.find(r => r.index === idx)?.score ?? 0) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {completed > 0 && completed === total && (
            <div className="tcr__summary">
              {passCount}/{total} tests passed ({passRate}%)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
