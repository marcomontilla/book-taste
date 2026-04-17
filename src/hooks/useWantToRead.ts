import { useState, useEffect, useCallback } from 'react'
import { getWantToReadBooks } from '@/services/collections'
import type { WantToReadItem } from '@/types'

export function useWantToRead() {
  const [items, setItems] = useState<WantToReadItem[]>([])
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { collectionId: cid, items: data } = await getWantToReadBooks()
      setCollectionId(cid)
      setItems(data as WantToReadItem[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Want to Read')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { items, collectionId, loading, error, refetch: fetch }
}
