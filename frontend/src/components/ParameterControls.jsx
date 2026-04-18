import { useState } from 'react'
import '../styles/SimulationComponents.css'

const PARAM_DEFS = [
  {
    key: 'temperature',
    label: 'Temperature',
    min: 0, max: 2, step: 0.1, default: 1.0,
    type: 'slider',
    markers: { 0: 'Deterministic', 1: 'Creative', 2: 'Random' },
  },
  {
    key: 'maxTokens',
    label: 'Max Tokens',
    min: 1, max: 4096, step: 1, default: 1024,
    type: 'number',
  },
  {
    key: 'topP',
    label: 'Top P',
    min: 0, max: 1, step: 0.05, default: 1.0,
    type: 'slider',
  },
  {
    key: 'frequencyPenalty',
    label: 'Frequency Penalty',
    min: -2, max: 2, step: 0.1, default: 0,
    type: 'slider',
  },
  {
    key: 'presencePenalty',
    label: 'Presence Penalty',
    min: -2, max: 2, step: 0.1, default: 0,
    type: 'slider',
  },
]

export const DEFAULT_PARAMS = Object.fromEntries(
  PARAM_DEFS.map(p => [p.key, p.default])
)

export default function ParameterControls({ params = DEFAULT_PARAMS, onChange }) {
  const [collapsed, setCollapsed] = useState(true)

  const update = (key, value) => {
    onChange?.({ ...params, [key]: value })
  }

  const resetParam = (def) => {
    update(def.key, def.default)
  }

  const formatValue = (val, step) => {
    if (step >= 1) return String(val)
    return Number(val).toFixed(step < 0.1 ? 2 : 1)
  }

  return (
    <div className="param-controls">
      <button
        className="param-controls__header"
        onClick={() => setCollapsed(c => !c)}
        type="button"
      >
        <span className="param-controls__title">Parameters</span>
        <span className="param-controls__toggle">{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <div className="param-controls__body">
          {PARAM_DEFS.map(def => {
            const val = params[def.key] ?? def.default
            return (
              <div className="param-controls__item" key={def.key}>
                <div className="param-controls__label-row">
                  <label className="param-controls__label">{def.label}</label>
                  <span className="param-controls__value">{formatValue(val, def.step)}</span>
                  {val !== def.default && (
                    <button
                      className="param-controls__reset"
                      onClick={() => resetParam(def)}
                      title={`Reset to ${def.default}`}
                      type="button"
                    >
                      ↺
                    </button>
                  )}
                </div>

                {def.type === 'slider' ? (
                  <div className="param-controls__slider-wrap">
                    <input
                      type="range"
                      className="param-controls__slider"
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      value={val}
                      onChange={e => update(def.key, parseFloat(e.target.value))}
                    />
                    {def.markers && (
                      <div className="param-controls__markers">
                        {Object.entries(def.markers).map(([pos, text]) => (
                          <span
                            key={pos}
                            className="param-controls__marker"
                            style={{ left: `${((pos - def.min) / (def.max - def.min)) * 100}%` }}
                          >
                            {text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="number"
                    className="param-controls__number"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={val}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v)) update(def.key, Math.min(def.max, Math.max(def.min, v)))
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
