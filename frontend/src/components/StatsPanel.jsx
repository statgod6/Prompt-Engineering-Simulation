export default function StatsPanel({ stats }) {
  const cards = [
    { icon: '\u26A1', label: 'Total XP', value: stats.totalXp.toLocaleString(), color: 'var(--accent)' },
    { icon: '\uD83D\uDCDA', label: 'Modules Completed', value: `${stats.modulesCompleted}/${stats.totalModules}`, color: 'var(--accent-green)' },
    { icon: '\uD83C\uDFC6', label: 'Badges Earned', value: stats.badges, color: 'var(--accent-yellow)' },
    { icon: '\uD83D\uDD25', label: 'Current Streak', value: `${stats.streak ?? 0}d`, color: 'var(--accent-red)' },
  ]

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <span className="stat-icon" style={{ color: card.color }}>{card.icon}</span>
          <span className="stat-value">{card.value}</span>
          <span className="stat-label">{card.label}</span>
        </div>
      ))}
    </div>
  )
}
