import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

export function useProgress() {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/user/progress')
      setProgress(normalizeProgress(response.data))
    } catch (err) {
      // Fallback to mock data for development
      setProgress(getMockProgress())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { progress, loading, error, refetch: fetchProgress }
}

// Normalize snake_case API fields to camelCase
function normalizeModule(m) {
  if (!m) return m
  return {
    ...m,
    partTitle: m.partTitle ?? m.part_title ?? '',
    passThreshold: Number(m.passThreshold ?? m.pass_threshold ?? 0.7),
    bestScore: Number(m.bestScore ?? m.best_score ?? 0),
    unlockAfter: m.unlockAfter ?? m.unlock_after ?? null,
    locked: m.locked ?? m.status === 'locked',
  }
}

// Normalize API response to ensure expected shape
function normalizeProgress(data) {
  if (!data || typeof data !== 'object') return getMockProgress()
  return {
    user: { username: 'Student', xp: 0, level: 1, streak: 0, ...data.user },
    stats: { modulesCompleted: 0, totalModules: 20, badges: 0, totalXp: 0, ...data.stats },
    modules: Array.isArray(data.modules) ? data.modules.map(normalizeModule) : [],
    recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
  }
}

// Mock data for development (before backend is connected)
function getMockProgress() {
  return {
    user: { username: 'Student', xp: 1250, level: 5, streak: 7 },
    stats: { modulesCompleted: 3, totalModules: 20, badges: 2, totalXp: 1250 },
    modules: [
      { id: 1, number: 1, title: 'What is Prompt Engineering?', part: 1, partTitle: 'Foundations', status: 'completed', bestScore: 0.95, passThreshold: 0.7, locked: false },
      { id: 2, number: 2, title: 'Anatomy of a Good Prompt', part: 1, partTitle: 'Foundations', status: 'completed', bestScore: 0.82, passThreshold: 0.7, locked: false },
      { id: 3, number: 3, title: 'Zero-Shot & Few-Shot Prompting', part: 1, partTitle: 'Foundations', status: 'completed', bestScore: 0.78, passThreshold: 0.7, locked: false },
      { id: 4, number: 4, title: 'Role & Persona Prompting', part: 1, partTitle: 'Foundations', status: 'available', bestScore: 0, passThreshold: 0.7, locked: false },
      { id: 5, number: 5, title: 'Output Formatting & Structured Responses', part: 2, partTitle: 'Intermediate', status: 'locked', bestScore: 0, passThreshold: 0.7, locked: true },
      ...Array.from({ length: 15 }, (_, i) => ({
        id: i + 6,
        number: i + 6,
        title: `Module ${i + 6}`,
        part: i + 6 <= 9 ? 2 : i + 6 <= 14 ? 3 : 4,
        partTitle: i + 6 <= 9 ? 'Intermediate' : i + 6 <= 14 ? 'Advanced' : 'Expert',
        status: 'locked',
        bestScore: 0,
        passThreshold: 0.7,
        locked: true,
      })),
    ],
    recentActivity: [
      { id: 1, module: 'Zero-Shot & Few-Shot', score: 0.78, model: 'GPT-4o', timestamp: new Date().toISOString() },
      { id: 2, module: 'Anatomy of a Good Prompt', score: 0.82, model: 'Claude 3.5', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, module: 'What is Prompt Engineering?', score: 0.95, model: 'GPT-4o', timestamp: new Date(Date.now() - 172800000).toISOString() },
    ],
  }
}
