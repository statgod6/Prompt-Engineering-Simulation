import { useState } from 'react'
import api from '../api/client'

export function useRun() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [responseTime, setResponseTime] = useState(0)
  const [tokenCount, setTokenCount] = useState({ input: 0, output: 0, total: 0 })

  const runPrompt = async ({
    model,
    messages,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    simulationId,
    stream = false,
  }) => {
    setLoading(true)
    setOutput('')
    setError(null)
    const startTime = Date.now()
    try {
      const response = await api.post('/run', {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stream,
        simulation_id: simulationId,
      })
      const elapsed = Date.now() - startTime
      setOutput(response.data.content)
      setResponseTime(elapsed)
      setTokenCount({
        input: response.data.tokens_input,
        output: response.data.tokens_output,
        total: response.data.tokens_total,
      })
      return response.data
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearOutput = () => {
    setOutput('')
    setError(null)
    setResponseTime(0)
  }

  return { output, loading, error, responseTime, tokenCount, runPrompt, clearOutput }
}
