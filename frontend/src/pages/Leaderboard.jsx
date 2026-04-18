import { useState, useMemo } from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import LeaderboardTable from '../components/LeaderboardTable'
import BadgeDisplay from '../components/BadgeDisplay'
import XPBar from '../components/XPBar'
import '../styles/Leaderboard.css'

const MODULE_TABS = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  label: `Module ${i + 1}`,
}))

const MEDAL_CLASSES = ['gold', 'silver', 'bronze']
const MEDAL_EMOJI = ['\u{1F947}', '\u{1F948}', '\u{1F949}']

/* Mock badges for dev */
const MOCK_BADGES = [
  { type: 'perfect_score', earnedAt: '2026-03-10T12:00:00Z' },
  { type: 'first_blood', earnedAt: '2026-02-15T08:30:00Z' },
  { type: 'streak_7', earnedAt: '2026-04-01T10:00:00Z' },
]

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('overall')
  const moduleId = activeTab === 'overall' ? null : activeTab
  const { entries, loading } = useLeaderboard(moduleId)

  /* Sort entries by score desc for podium */
  const ranked = useMemo(() => {
    return [...entries].sort((a, b) => b.bestScore - a.bestScore)
  }, [entries])

  const top3 = ranked.slice(0, 3)

  if (loading) {
    return (
      <div className="leaderboard-page">
        <h1>Leaderboard</h1>
        <div className="lb-skeleton">
          <div className="lb-skel-bar wide" />
          <div className="lb-skel-bar wide" />
          <div className="lb-skel-bar med" />
          <div className="lb-skel-bar med" />
          <div className="lb-skel-bar sm" />
          <div className="lb-skel-bar sm" />
          <div className="lb-skel-bar wide" />
          <div className="lb-skel-bar med" />
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard-page">
      <h1>Leaderboard</h1>

      {/* XP Bar */}
      <XPBar xp={1250} xpPerLevel={500} />

      {/* Tab bar */}
      <div className="lb-tabs">
        <button
          className={`lb-tab ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Overall
        </button>
        {MODULE_TABS.map((t) => (
          <button
            key={t.id}
            className={`lb-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Module selector dropdown */}
      <div className="lb-module-select">
        <label htmlFor="lb-mod-select">Jump to module:</label>
        <select
          id="lb-mod-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="overall">Overall</option>
          {MODULE_TABS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Podium — top 3 */}
      <div className="lb-podium">
        {top3.map((user, i) => (
          <div key={user.id} className={`lb-podium-card ${MEDAL_CLASSES[i]}`}>
            <span className="lb-podium-rank">{MEDAL_EMOJI[i]}</span>
            <div className="lb-podium-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="lb-podium-name">{user.username}</span>
            <span className="lb-podium-score">{Math.round(user.bestScore * 100)}%</span>
          </div>
        ))}
      </div>

      {/* Full rankings table */}
      <LeaderboardTable entries={ranked} currentUserId={5} showTime />

      {/* Badges section */}
      <section className="badge-section">
        <h2>Badges</h2>
        <BadgeDisplay badges={MOCK_BADGES} />
      </section>
    </div>
  )
}
