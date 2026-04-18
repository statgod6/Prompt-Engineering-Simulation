import { useEffect, useRef } from 'react'

export default function XPBar({ xp = 0, xpPerLevel = 500 }) {
  const level = Math.floor(xp / xpPerLevel) + 1
  const xpInLevel = xp % xpPerLevel
  const pct = (xpInLevel / xpPerLevel) * 100
  const nearLevelUp = pct >= 85
  const barRef = useRef(null)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    el.style.width = '0%'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.width = `${pct}%`
      })
    })
  }, [pct])

  return (
    <div className={`xp-bar-wrap ${nearLevelUp ? 'xp-glow' : ''}`}>
      <span className="xp-level">Lvl {level}</span>
      <div className="xp-track">
        <div ref={barRef} className="xp-fill" style={{ width: 0 }} />
      </div>
      <span className="xp-text">
        {xpInLevel} / {xpPerLevel} XP
      </span>
    </div>
  )
}
