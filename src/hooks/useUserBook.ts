import { useState, useEffect, useCallback } from 'react'
import { getUserBook } from '@/services/userBooks'
import type { UserBookWithBook } from '@/types'

export function useUserBook(userBookId: string) {
  const [userBook, setUserBook] = useState<UserBookWithBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUserBook(userBookId)
      setUserBook(data as UserBookWithBook)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Book not found')
    } finally {
      setLoading(false)
    }
  }, [userBookId])

  useEffect(() => { fetch() }, [fetch])

  return { userBook, setUserBook, loading, error }
}
