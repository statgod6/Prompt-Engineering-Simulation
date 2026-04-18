import { useState } from 'react'
import api from '../api/client'

export function useEvaluate() {
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const evaluate = async ({ output, testCase, scoring, simulationId }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/evaluate', {
        output,
        test_case: testCase,
        scoring,
        simulation_id: simulationId,
      })
      setScore(response.data)
      return response.data
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
      // Mock score for development
      const mockScore = {
        scores: { accuracy: 0.85, format_compliance: 0.9, consistency: 0.8 },
        composite: 0.85,
        passed: true,
      }
      setScore(mockScore)
      return mockScore
    } finally {
      setLoading(false)
    }
  }

  const evaluateBatch = async ({ outputs, testCases, scoring, simulationId }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/evaluate/batch', {
        outputs,
        test_cases: testCases,
        scoring,
        simulation_id: simulationId,
      })
      setScore(response.data)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { score, loading, error, evaluate, evaluateBatch, clearScore: () => setScore(null) }
}
