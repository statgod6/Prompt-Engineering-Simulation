import { useState, useRef, useEffect } from 'react'
import '../styles/SimulationComponents.css'

const ALL_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B', provider: 'Meta' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral' },
]

const PROVIDER_COLORS = {
  OpenAI: 'var(--accent-green)',
  Anthropic: 'var(--accent-purple)',
  Meta: 'var(--accent)',
  Google: 'var(--accent-yellow)',
  Mistral: 'var(--accent-red)',
}

export default function ModelSelector({
  selectedModel = 'openai/gpt-4o',
  onModelChange,
  allowedModels,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const models = allowedModels
    ? ALL_MODELS.filter(m => allowedModels.includes(m.id))
    : ALL_MODELS

  const selected = ALL_MODELS.find(m => m.id === selectedModel) || ALL_MODELS[0]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="model-selector" ref={ref}>
      <button
        className="model-selector__trigger"
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className="model-selector__name">{selected.name}</span>
        <span
          className="model-selector__provider-tag"
          style={{ color: PROVIDER_COLORS[selected.provider] }}
        >
          {selected.provider}
        </span>
        <span className="model-selector__caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className="model-selector__dropdown">
          {models.map(model => (
            <li key={model.id}>
              <button
                className={`model-selector__option ${model.id === selectedModel ? 'model-selector__option--active' : ''}`}
                onClick={() => { onModelChange?.(model.id); setOpen(false) }}
                type="button"
              >
                <span className="model-selector__option-name">{model.name}</span>
                <span
                  className="model-selector__option-provider"
                  style={{ color: PROVIDER_COLORS[model.provider] }}
                >
                  {model.provider}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { ALL_MODELS }
