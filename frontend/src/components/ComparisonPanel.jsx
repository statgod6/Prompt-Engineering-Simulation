import '../styles/ComparisonHistory.css'

const MODEL_INFO = {
  'openai/gpt-4o': { name: 'GPT-4o', provider: 'OpenAI', color: 'var(--accent-green)' },
  'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: 'var(--accent-purple)' },
  'meta-llama/llama-3-70b': { name: 'Llama 3 70B', provider: 'Meta', color: 'var(--accent)' },
  'google/gemini-pro': { name: 'Gemini Pro', provider: 'Google', color: 'var(--accent-yellow)' },
  'mistralai/mistral-large': { name: 'Mistral Large', provider: 'Mistral', color: 'var(--accent-red)' },
}

export default function ComparisonPanel({ model, output, responseTime, tokenCount, cost, score, isBest, loading }) {
  const info = MODEL_INFO[model] || { name: model, provider: 'Unknown', color: 'var(--accent)' }

  if (loading) {
    return (
      <div className="comparison-panel comparison-panel--loading">
        <div className="comparison-panel__header">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--tag" />
        </div>
        <div className="comparison-panel__output">
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line" style={{ width: '85%' }} />
          <div className="skeleton skeleton--line" style={{ width: '70%' }} />
          <div className="skeleton skeleton--line" style={{ width: '90%' }} />
          <div className="skeleton skeleton--line" style={{ width: '60%' }} />
        </div>
        <div className="comparison-panel__metrics">
          <div className="skeleton skeleton--metric" />
          <div className="skeleton skeleton--metric" />
          <div className="skeleton skeleton--metric" />
        </div>
      </div>
    )
  }

  return (
    <div className={`comparison-panel ${isBest ? 'comparison-panel--best' : ''}`}>
      <div className="comparison-panel__header">
        <span className="comparison-panel__model-name">{info.name}</span>
        <span className="comparison-panel__provider" style={{ color: info.color }}>
          {info.provider}
        </span>
        {isBest && <span className="comparison-panel__best-badge">Best</span>}
      </div>

      <div className="comparison-panel__output">
        <pre className="comparison-panel__text">{output || 'No output'}</pre>
      </div>

      <div className="comparison-panel__metrics">
        <div className="comparison-panel__metric">
          <span className="comparison-panel__metric-label">Time</span>
          <span className="comparison-panel__metric-value">{responseTime ?? '—'}ms</span>
        </div>
        <div className="comparison-panel__metric">
          <span className="comparison-panel__metric-label">Tokens</span>
          <span className="comparison-panel__metric-value">
            {tokenCount ? `${tokenCount.input}/${tokenCount.output}` : '—'}
          </span>
        </div>
        <div className="comparison-panel__metric">
          <span className="comparison-panel__metric-label">Cost</span>
          <span className="comparison-panel__metric-value">
            {cost !== undefined ? `$${cost.toFixed(4)}` : '—'}
          </span>
        </div>
        {score !== undefined && score !== null && (
          <div className="comparison-panel__metric">
            <span className="comparison-panel__metric-label">Score</span>
            <span
              className="comparison-panel__metric-value"
              style={{
                color: score >= 0.7 ? 'var(--accent-green)' : score >= 0.5 ? 'var(--accent-yellow)' : 'var(--accent-red)',
              }}
            >
              {score.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
