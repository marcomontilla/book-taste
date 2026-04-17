import { useState, useEffect, useCallback } from 'react'
import { getLibrary } from '@/services/userBooks'
import type { UserBookWithBook } from '@/types'

export function useLibrary() {
  const [userBooks, setUserBooks] = useState<UserBookWithBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLibrary()
      setUserBooks(data as UserBookWithBook[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { userBooks, loading, error, refetch: fetch }
}
