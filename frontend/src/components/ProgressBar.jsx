import { useState, useEffect } from 'react'

export default function ProgressBar({
  value = 0,
  color,
  height = 8,
  showLabel = false,
  animated = true,
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    // Trigger animation on mount / value change
    const timer = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), 50)
    return () => clearTimeout(timer)
  }, [value])

  const barColor = color || 'var(--accent)'

  return (
    <div className="progress-bar-wrapper" style={{ height }}>
      <div
        className={`progress-bar-fill ${animated ? 'animated' : ''}`}
        style={{
          width: `${width}%`,
          background: barColor,
          height: '100%',
          borderRadius: 'inherit',
        }}
      />
      {showLabel && (
        <span className="progress-bar-label">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}
