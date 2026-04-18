import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const MOCK_USERS = [
  { id: 1, username: 'PromptMaster', avatar: null, bestScore: 0.98, attempts: 14, bestTime: 42, xp: 4200, level: 9 },
  { id: 2, username: 'TokenWhiz', avatar: null, bestScore: 0.95, attempts: 11, bestTime: 55, xp: 3800, level: 8 },
  { id: 3, username: 'NeuralNinja', avatar: null, bestScore: 0.93, attempts: 9, bestTime: 63, xp: 3500, level: 7 },
  { id: 4, username: 'ChainThinker', avatar: null, bestScore: 0.89, attempts: 12, bestTime: 70, xp: 2900, level: 6 },
  { id: 5, username: 'Student', avatar: null, bestScore: 0.85, attempts: 8, bestTime: 78, xp: 1250, level: 5 },
  { id: 6, username: 'FewShotPro', avatar: null, bestScore: 0.82, attempts: 7, bestTime: 90, xp: 2100, level: 5 },
  { id: 7, username: 'ZeroShotter', avatar: null, bestScore: 0.78, attempts: 10, bestTime: 95, xp: 1800, level: 4 },
  { id: 8, username: 'RolePlayer', avatar: null, bestScore: 0.75, attempts: 6, bestTime: 110, xp: 1400, level: 3 },
  { id: 9, username: 'MetaMinds', avatar: null, bestScore: 0.70, attempts: 5, bestTime: 120, xp: 1100, level: 3 },
  { id: 10, username: 'Newbie42', avatar: null, bestScore: 0.62, attempts: 3, bestTime: null, xp: 600, level: 2 },
]

function getMockEntries(moduleId) {
  if (!moduleId || moduleId === 'overall') return MOCK_USERS
  // Slightly vary scores per module for realism
  const seed = parseInt(moduleId, 10) || 1
  return MOCK_USERS.map((u) => ({
    ...u,
    bestScore: Math.max(0.3, Math.min(1, u.bestScore + (((seed * u.id) % 7) - 3) * 0.03)),
    attempts: Math.max(1, u.attempts + ((seed * u.id) % 5) - 2),
  }))
}

export function useLeaderboard(moduleId = null) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = moduleId && moduleId !== 'overall'
        ? `/leaderboard/${moduleId}`
        : '/leaderboard/overall'
      const response = await api.get(endpoint)
      setEntries(response.data.entries || response.data)
    } catch {
      // Fallback to mock data
      setEntries(getMockEntries(moduleId))
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return { entries, loading, error, refetch: fetchLeaderboard }
}
