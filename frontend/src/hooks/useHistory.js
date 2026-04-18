import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const MOCK_MODULES = [
  'What is Prompt Engineering', 'Anatomy of a Good Prompt', 'Zero-Shot & Few-Shot',
  'Role & Persona Prompting', 'Output Formatting', 'Chain of Thought',
  'Instruction Decomposition', 'Prompt Templates', 'Handling Ambiguity', 'Self-Consistency',
]

const MOCK_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
]

function generateMockRuns() {
  const runs = []
  const baseDate = new Date('2026-04-10T08:00:00Z')

  for (let i = 0; i < 20; i++) {
    const mod = MOCK_MODULES[i % MOCK_MODULES.length]
    const model = MOCK_MODELS[i % MOCK_MODELS.length]
    const score = +(Math.random() * 0.6 + 0.35).toFixed(2)
    const tokensInput = Math.floor(Math.random() * 400) + 100
    const tokensOutput = Math.floor(Math.random() * 600) + 50
    const cost = +((tokensInput * 0.00003 + tokensOutput * 0.00006)).toFixed(5)
    const date = new Date(baseDate.getTime() + i * 3600000 * 3)

    runs.push({
      id: `run-${1000 + i}`,
      date: date.toISOString(),
      module: mod,
      module_id: (i % MOCK_MODULES.length) + 1,
      simulation: `sim-${(i % 3) + 1}`,
      model: model.id,
      model_name: model.name,
      prompt: `Write a prompt that demonstrates ${mod.toLowerCase()} techniques for a customer service chatbot scenario with edge cases and multilingual support requirements.`,
      output: `Here is a sample response demonstrating ${mod.toLowerCase()} for simulation ${(i % 3) + 1}. The model produced a structured output covering the key aspects of the technique with examples and explanations tailored to the scenario.`,
      score,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      tokens_total: tokensInput + tokensOutput,
      cost,
      response_time: Math.floor(Math.random() * 3000) + 500,
      temperature: +(Math.random() * 0.8 + 0.2).toFixed(1),
      max_tokens: [256, 512, 1024, 2048][i % 4],
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0,
    })
  }

  return runs.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const MOCK_RUNS = generateMockRuns()

export function useHistory(filters = {}) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(filters.page || 1)
  const limit = filters.limit || 10

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit,
        ...(filters.module && { module: filters.module }),
        ...(filters.model && { model: filters.model }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
        ...(filters.scoreMin !== undefined && { score_min: filters.scoreMin }),
        ...(filters.scoreMax !== undefined && { score_max: filters.scoreMax }),
      }
      const response = await api.get('/history', { params })
      setRuns(response.data.runs || [])
      setTotalCount(response.data.total || 0)
    } catch {
      // Fallback to mock data
      let filtered = [...MOCK_RUNS]

      if (filters.module) {
        filtered = filtered.filter(r => r.module === filters.module)
      }
      if (filters.model) {
        filtered = filtered.filter(r => r.model === filters.model)
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(r => new Date(r.date) >= new Date(filters.dateFrom))
      }
      if (filters.dateTo) {
        filtered = filtered.filter(r => new Date(r.date) <= new Date(filters.dateTo))
      }
      if (filters.scoreMin !== undefined) {
        filtered = filtered.filter(r => r.score >= filters.scoreMin)
      }
      if (filters.scoreMax !== undefined) {
        filtered = filtered.filter(r => r.score <= filters.scoreMax)
      }

      setTotalCount(filtered.length)
      const start = (page - 1) * limit
      setRuns(filtered.slice(start, start + limit))
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters.module, filters.model, filters.dateFrom, filters.dateTo, filters.scoreMin, filters.scoreMax])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { runs, loading, error, totalCount, page, setPage, refetch: fetchHistory }
}
