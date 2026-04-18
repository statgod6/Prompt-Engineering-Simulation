import { useMemo } from 'react'
import '../styles/SimulationComponents.css'

const MODEL_PRICING = {
  'openai/gpt-4o':                { input: 2.50,  output: 10.00 },
  'anthropic/claude-3.5-sonnet':  { input: 3.00,  output: 15.00 },
  'meta-llama/llama-3-70b':       { input: 0.59,  output: 0.79  },
  'google/gemini-pro':            { input: 0.50,  output: 1.50  },
  'mistralai/mistral-large':      { input: 2.00,  output: 6.00  },
}

function estimateTokens(text) {
  if (!text) return 0
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)
}

export default function TokenCounter({
  inputText = '',
  model = 'openai/gpt-4o',
  maxTokens = 1024,
}) {
  const { inputTokens, cost } = useMemo(() => {
    const tokens = estimateTokens(inputText)
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['openai/gpt-4o']
    const inputCost = (tokens / 1_000_000) * pricing.input
    const outputCost = (maxTokens / 1_000_000) * pricing.output
    return {
      inputTokens: tokens,
      cost: inputCost + outputCost,
    }
  }, [inputText, model, maxTokens])

  const formatCost = (c) => {
    if (c < 0.0001) return '$0.0000'
    if (c < 0.01) return `$${c.toFixed(4)}`
    return `$${c.toFixed(4)}`
  }

  return (
    <div className="token-counter">
      <span className="token-counter__tokens">~{inputTokens} tokens</span>
      <span className="token-counter__separator">|</span>
      <span className="token-counter__max">max {maxTokens} out</span>
      <span className="token-counter__separator">|</span>
      <span className="token-counter__cost">Est. cost: {formatCost(cost)}</span>
    </div>
  )
}

export { MODEL_PRICING, estimateTokens }
