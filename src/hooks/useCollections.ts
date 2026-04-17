import { useState, useEffect, useCallback } from 'react'
import { getCollections } from '@/services/collections'
import type { CollectionSummary } from '@/types'

export function useCollections() {
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCollections()
      setCollections(data as CollectionSummary[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { collections, loading, error, refetch: fetch }
}
