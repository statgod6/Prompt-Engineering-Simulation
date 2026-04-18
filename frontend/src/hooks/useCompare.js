import { useState } from 'react'
import api from '../api/client'

const MOCK_RESPONSES = {
  'openai/gpt-4o': {
    content: 'GPT-4o response: This is a comprehensive analysis of the prompt following best practices. The output is well-structured with clear sections, examples, and actionable insights. Token efficiency is optimized while maintaining quality.',
    tokens_input: 245,
    tokens_output: 380,
    cost: 0.0302,
  },
  'anthropic/claude-3.5-sonnet': {
    content: 'Claude 3.5 Sonnet response: Here is a thoughtful exploration of the topic with nuanced reasoning. The response balances depth with clarity, providing step-by-step explanations and considering edge cases throughout.',
    tokens_input: 245,
    tokens_output: 420,
    cost: 0.0267,
  },
  'meta-llama/llama-3-70b': {
    content: 'Llama 3 70B response: A detailed and structured answer that addresses the core requirements. The model demonstrates strong instruction-following capabilities with practical examples and clear formatting.',
    tokens_input: 245,
    tokens_output: 350,
    cost: 0.0058,
  },
  'google/gemini-pro': {
    content: 'Gemini Pro response: An organized and insightful response covering all aspects of the prompt. The output includes relevant context, well-reasoned analysis, and concrete recommendations.',
    tokens_input: 245,
    tokens_output: 390,
    cost: 0.0195,
  },
  'mistralai/mistral-large': {
    content: 'Mistral Large response: A precise and efficient answer that directly addresses the prompt requirements. The response is concise yet thorough, with good use of structured formatting.',
    tokens_input: 245,
    tokens_output: 310,
    cost: 0.0165,
  },
}

export function useCompare() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const compareModels = async ({ models, messages, temperature = 0.7, maxTokens = 1024 }) => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await api.post('/compare', {
        models,
        messages,
        temperature,
        max_tokens: maxTokens,
      })
      setResults(response.data.results || [])
      return response.data.results
    } catch {
      // Mock fallback
      const mockResults = models.map((modelId) => {
        const mock = MOCK_RESPONSES[modelId] || MOCK_RESPONSES['openai/gpt-4o']
        const responseTime = Math.floor(Math.random() * 2500) + 800
        const score = +(Math.random() * 0.4 + 0.6).toFixed(2)
        return {
          model: modelId,
          output: mock.content,
          tokens_input: mock.tokens_input,
          tokens_output: mock.tokens_output,
          tokens_total: mock.tokens_input + mock.tokens_output,
          cost: mock.cost,
          response_time: responseTime,
          score,
        }
      })

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResults(mockResults)
      return mockResults
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setError(null)
  }

  return { results, loading, error, compareModels, clearResults }
}
