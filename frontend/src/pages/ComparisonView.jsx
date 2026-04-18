import { useState, useMemo } from 'react'
import ComparisonPanel from '../components/ComparisonPanel'
import { useCompare } from '../hooks/useCompare'
import '../styles/ComparisonHistory.css'

const ALL_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B', provider: 'Meta' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral' },
]

export default function ComparisonView() {
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState(['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'])
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)
  const { results, loading, error, compareModels, clearResults } = useCompare()

  const toggleModel = (modelId) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.length > 2 ? prev.filter((m) => m !== modelId) : prev
      }
      return prev.length < 4 ? [...prev, modelId] : prev
    })
  }

  const handleCompare = () => {
    if (!prompt.trim() || selectedModels.length < 2) return
    compareModels({
      models: selectedModels,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      maxTokens,
    })
  }

  const bestModelId = useMemo(() => {
    if (!results.length) return null
    const best = results.reduce((a, b) => ((a.score ?? 0) >= (b.score ?? 0) ? a : b))
    return best.model
  }, [results])

  const totalTokens = results.reduce((s, r) => s + (r.tokens_total || 0), 0)
  const totalCost = results.reduce((s, r) => s + (r.cost || 0), 0)

  return (
    <div className="comparison-page">
      <h1 className="page-title">Model Comparison</h1>

      {/* Prompt Input */}
      <div className="comparison-prompt card">
        <label className="comparison-prompt__label">Prompt</label>
        <textarea
          className="comparison-prompt__input"
          rows={4}
          placeholder="Enter your prompt to compare across models..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Model Selection */}
      <div className="comparison-controls card">
        <div className="comparison-models">
          <label className="comparison-controls__label">Select Models (2–4)</label>
          <div className="comparison-models__grid">
            {ALL_MODELS.map((m) => (
              <label
                key={m.id}
                className={`comparison-model-checkbox ${selectedModels.includes(m.id) ? 'comparison-model-checkbox--checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(m.id)}
                  onChange={() => toggleModel(m.id)}
                />
                <span className="comparison-model-checkbox__name">{m.name}</span>
                <span className="comparison-model-checkbox__provider">{m.provider}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="comparison-params">
          <div className="comparison-param">
            <label>Temperature: {temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(+e.target.value)}
            />
          </div>
          <div className="comparison-param">
            <label>Max Tokens</label>
            <select value={maxTokens} onChange={(e) => setMaxTokens(+e.target.value)}>
              <option value={256}>256</option>
              <option value={512}>512</option>
              <option value={1024}>1024</option>
              <option value={2048}>2048</option>
              <option value={4096}>4096</option>
            </select>
          </div>
        </div>

        <div className="comparison-actions">
          <button
            className="btn btn-primary"
            onClick={handleCompare}
            disabled={loading || !prompt.trim() || selectedModels.length < 2}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
          {results.length > 0 && (
            <button className="btn" onClick={clearResults}>
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <div className="comparison-error">{error}</div>}

      {/* Results Grid */}
      {(loading || results.length > 0) && (
        <div
          className="comparison-grid"
          style={{ gridTemplateColumns: `repeat(${selectedModels.length}, 1fr)` }}
        >
          {loading
            ? selectedModels.map((m) => (
                <ComparisonPanel key={m} model={m} loading />
              ))
            : results.map((r) => (
                <ComparisonPanel
                  key={r.model}
                  model={r.model}
                  output={r.output}
                  responseTime={r.response_time}
                  tokenCount={{ input: r.tokens_input, output: r.tokens_output }}
                  cost={r.cost}
                  score={r.score}
                  isBest={r.model === bestModelId}
                />
              ))}
        </div>
      )}

      {/* Summary Row */}
      {results.length > 0 && (
        <div className="comparison-summary card">
          <span>Total Tokens: <strong>{totalTokens}</strong></span>
          <span>Total Cost: <strong>${totalCost.toFixed(4)}</strong></span>
          <span>Models Compared: <strong>{results.length}</strong></span>
        </div>
      )}
    </div>
  )
}
