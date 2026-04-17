import { useState, useEffect, useCallback } from 'react'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/services/notes'
import type { Note } from '@/types'

export function useNotes(userBookId: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const data = await getNotes(userBookId)
      setNotes(data as Note[])
    } catch {
      // notes are secondary — don't block the page on failure
    } finally {
      setLoading(false)
    }
  }, [userBookId])

  useEffect(() => { fetch() }, [fetch])

  const add = useCallback(async (content: string, pageNumber?: number) => {
    const note = await createNote(userBookId, content, pageNumber)
    setNotes(prev => [...prev, note as Note])
  }, [userBookId])

  const update = useCallback(async (
    noteId: string,
    content: string,
    pageNumber: number | null,
  ) => {
    await updateNote(noteId, content, pageNumber)
    setNotes(prev =>
      prev.map(n =>
        n.id === noteId ? { ...n, content, page_number: pageNumber } : n,
      ),
    )
  }, [])

  const remove = useCallback(async (noteId: string) => {
    await deleteNote(noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }, [])

  return { notes, loading, add, update, remove }
}
