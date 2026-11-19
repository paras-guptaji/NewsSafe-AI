import { useState, useEffect, useCallback } from 'react'
import { statsAPI } from '../services/api'

export function useStats() {
  const [stats, setStats] = useState({
    total_articles: 0,
    adult_articles: 0,
    below18_articles: 0,
    pending_articles: 0,
    category_distribution: {},
    age_distribution: {},
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await statsAPI.getStats()
      const data = response.data || {}
      setStats({
        total_articles: data.total_articles ?? data.total ?? 0,
        adult_articles: data.adult_articles ?? data.adult ?? data['18+'] ?? 0,
        below18_articles: data.below18_articles ?? data.below18 ?? data['Below 18'] ?? 0,
        pending_articles: data.pending_articles ?? data.pending ?? data['Pending'] ?? 0,
        category_distribution: data.category_distribution || data.categories || {},
        age_distribution: data.age_distribution || data.age || {},
        ...data,
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError(err.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
