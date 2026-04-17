import { useState, useEffect, useCallback } from 'react'
import {
  getCachedInsight,
  getCachedRecommendations,
  generateAndCacheInsights,
  type GenerateOptions,
} from '@/services/intelligence'
import type { BookInsight, BookRecommendation } from '@/types'

export function useInsights(bookId: string) {
  const [insight, setInsight]               = useState<BookInsight | null>(null)
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([])
  const [loading, setLoading]               = useState(true)
  const [generating, setGenerating]         = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const loadCache = useCallback(async () => {
    setLoading(true)
    try {
      const [ins, recs] = await Promise.all([
        getCachedInsight(bookId),
        getCachedRecommendations(bookId),
      ])
      setInsight(ins)
      setRecommendations(recs)
    } catch {
      // Cache miss is fine — just show the generate button
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => { loadCache() }, [loadCache])

  const generate = useCallback(async (opts: GenerateOptions) => {
    setGenerating(true)
    setError(null)
    try {
      const { insight: ins, recommendations: recs } =
        await generateAndCacheInsights(bookId, opts)
      setInsight(ins)
      setRecommendations(recs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }, [bookId])

  return {
    insight,
    recommendations,
    loading,
    generating,
    error,
    generate,
    hasInsights: insight !== null,
  }
}
