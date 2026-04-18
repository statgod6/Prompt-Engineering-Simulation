const ALL_BADGE_DEFS = {
  perfect_score:  { icon: '\u2B50', title: 'Perfect Score',  desc: 'Achieved >=95% on a simulation' },
  speed_run:      { icon: '\u26A1', title: 'Speed Runner',   desc: 'Completed in under 60 seconds' },
  first_blood:    { icon: '\u{1FA78}', title: 'First Blood', desc: 'First attempt on a new module' },
  streak_7:       { icon: '\u{1F525}', title: 'Week Warrior', desc: '7-day activity streak' },
  streak_30:      { icon: '\u{1F48E}', title: 'Diamond Streak', desc: '30-day activity streak' },
  completionist:  { icon: '\u{1F3C6}', title: 'Completionist', desc: 'Finished all 20 modules' },
  explorer:       { icon: '\u{1F50D}', title: 'Explorer',     desc: 'Tried all 5 models on one simulation' },
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BadgeDisplay({ badges = [], allBadgeTypes = Object.keys(ALL_BADGE_DEFS) }) {
  const earnedMap = {}
  badges.forEach((b) => { earnedMap[b.type] = b })

  return (
    <div className="badge-grid">
      {allBadgeTypes.map((type) => {
        const def = ALL_BADGE_DEFS[type]
        if (!def) return null
        const earned = earnedMap[type]
        return (
          <div key={type} className={`badge-card ${earned ? 'badge-earned' : 'badge-locked'}`}>
            <span className="badge-icon">{def.icon}</span>
            <div className="badge-info">
              <span className="badge-title">{def.title}</span>
              <span className="badge-desc">{def.desc}</span>
              {earned ? (
                <span className="badge-date">Earned {formatDate(earned.earnedAt)}</span>
              ) : (
                <span className="badge-lock-label">Locked</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
