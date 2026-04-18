import { useState, useEffect, useRef, useCallback } from 'react'

export default function TimerWidget({ timeLimitSeconds, onTimeUp, active = false }) {
  const [remaining, setRemaining] = useState(timeLimitSeconds || 0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (timeLimitSeconds) setRemaining(timeLimitSeconds)
  }, [timeLimitSeconds])

  useEffect(() => {
    if (active && !running) {
      setRunning(true)
    }
  }, [active])

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            onTimeUp?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, onTimeUp])

  const handleStart = useCallback(() => setRunning(true), [])
  const handlePause = useCallback(() => {
    setRunning(false)
    clearInterval(intervalRef.current)
  }, [])
  const handleReset = useCallback(() => {
    setRunning(false)
    clearInterval(intervalRef.current)
    setRemaining(timeLimitSeconds || 0)
  }, [timeLimitSeconds])

  if (!timeLimitSeconds) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isWarning = remaining <= 30
  const isDanger = remaining <= 10

  return (
    <div className={`timer-widget ${isWarning ? 'timer-widget--warning' : ''} ${isDanger ? 'timer-widget--danger' : ''}`}>
      <span className={`timer-widget__time ${isDanger ? 'timer-widget__time--pulse' : ''}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <div className="timer-widget__controls">
        {!running ? (
          <button
            className="timer-widget__btn"
            onClick={handleStart}
            disabled={remaining === 0}
            type="button"
            title="Start"
          >
            ▶
          </button>
        ) : (
          <button
            className="timer-widget__btn"
            onClick={handlePause}
            type="button"
            title="Pause"
          >
            ⏸
          </button>
        )}
        <button
          className="timer-widget__btn"
          onClick={handleReset}
          type="button"
          title="Reset"
        >
          ↺
        </button>
      </div>
    </div>
  )
}
