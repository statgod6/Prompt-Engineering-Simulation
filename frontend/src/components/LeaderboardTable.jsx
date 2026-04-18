import { useState, useMemo } from 'react'

const MEDALS = { 1: '\u{1F947}', 2: '\u{1F948}', 3: '\u{1F949}' }

function scoreColor(score) {
  if (score >= 0.8) return 'var(--accent-green)'
  if (score >= 0.6) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function LeaderboardTable({ entries = [], currentUserId = 5, showTime = true }) {
  const [sortKey, setSortKey] = useState('bestScore')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'username' ? 'asc' : 'desc')
    }
  }

  const sorted = useMemo(() => {
    const copy = [...entries]
    copy.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy.map((e, i) => ({ ...e, rank: i + 1 }))
  }, [entries, sortKey, sortDir])

  const arrow = (key) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC'
  }

  return (
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th className="lb-th-rank">#</th>
            <th className="lb-th-sortable" onClick={() => handleSort('username')}>
              Username{arrow('username')}
            </th>
            <th className="lb-th-sortable" onClick={() => handleSort('bestScore')}>
              Best Score{arrow('bestScore')}
            </th>
            <th className="lb-th-sortable" onClick={() => handleSort('attempts')}>
              Attempts{arrow('attempts')}
            </th>
            {showTime && (
              <th className="lb-th-sortable" onClick={() => handleSort('bestTime')}>
                Best Time{arrow('bestTime')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const isMe = entry.id === currentUserId
            const pct = Math.round(entry.bestScore * 100)
            return (
              <tr key={entry.id} className={`lb-row ${isMe ? 'lb-row-me' : ''}`}>
                <td className="lb-cell-rank">
                  {MEDALS[entry.rank] || entry.rank}
                </td>
                <td className="lb-cell-user">
                  <span className="lb-avatar">{entry.username.charAt(0).toUpperCase()}</span>
                  <span>{entry.username}{isMe && <span className="lb-you-tag">YOU</span>}</span>
                </td>
                <td className="lb-cell-score">
                  <div className="lb-score-bar-bg">
                    <div
                      className="lb-score-bar-fill"
                      style={{ width: `${pct}%`, background: scoreColor(entry.bestScore) }}
                    />
                  </div>
                  <span className="lb-score-value" style={{ color: scoreColor(entry.bestScore) }}>
                    {pct}%
                  </span>
                </td>
                <td>{entry.attempts}</td>
                {showTime && <td>{formatTime(entry.bestTime)}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
