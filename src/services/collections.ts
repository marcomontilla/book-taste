import { supabase } from '@/lib/supabase'
import type { BookCollectionStatus } from '@/types'

// ── Want to Read ──────────────────────────────────────────────────────────────

async function getWtrCollectionId(): Promise<string> {
  const { data, error } = await supabase
    .from('collections')
    .select('id')
    .eq('is_want_to_read', true)
    .single()
  if (error) throw error
  return data.id
}

export async function getWantToReadBooks() {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      id,
      collection_books (
        id,
        book_id,
        added_at,
        book:books (*)
      )
    `)
    .eq('is_want_to_read', true)
    .single()
  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.collection_books as any[]).map(cb => ({
    collectionBookId: cb.id as string,
    bookId: cb.book_id as string,
    addedAt: cb.added_at as string,
    book: cb.book,
  }))

  return { collectionId: data.id, items }
}

export async function addToWantToRead(bookId: string) {
  const collectionId = await getWtrCollectionId()
  const { error } = await supabase
    .from('collection_books')
    .insert({ collection_id: collectionId, book_id: bookId })
  if (error) {
    if (error.code === '23505') throw new Error('Book is already in Want to Read')
    throw error
  }
}

export async function removeFromWantToRead(collectionBookId: string) {
  const { error } = await supabase
    .from('collection_books')
    .delete()
    .eq('id', collectionBookId)
  if (error) throw error
}

// ── User collections ──────────────────────────────────────────────────────────

export async function getCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_books(id)')
    .eq('is_want_to_read', false)
    .order('created_at', { ascending: true })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((c: any) => ({ ...c, bookCount: c.collection_books.length as number }))
}

export async function getCollectionWithBooks(collectionId: string) {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_books (
        id,
        book_id,
        added_at,
        book:books (*)
      )
    `)
    .eq('id', collectionId)
    .single()
  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const books = (data.collection_books as any[]).map(cb => ({
    collectionBookId: cb.id as string,
    book: cb.book,
  }))

  return { ...data, books }
}

export async function createCollection(name: string) {
  const { data, error } = await supabase
    .from('collections')
    .insert({ name, is_want_to_read: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameCollection(id: string, name: string) {
  const { error } = await supabase
    .from('collections')
    .update({ name })
    .eq('id', id)
  if (error) throw error
}

export async function deleteCollection(id: string) {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function addBookToCollection(collectionId: string, bookId: string) {
  const { error } = await supabase
    .from('collection_books')
    .insert({ collection_id: collectionId, book_id: bookId })
  if (error) {
    if (error.code === '23505') throw new Error('Book is already in this collection')
    throw error
  }
}

export async function removeBookFromCollection(collectionBookId: string) {
  const { error } = await supabase
    .from('collection_books')
    .delete()
    .eq('id', collectionBookId)
  if (error) throw error
}

// Returns all user collections with membership status for a given book.
// Used on the book detail page to show/manage collection memberships.
export async function getCollectionsForBook(bookId: string): Promise<BookCollectionStatus[]> {
  const [{ data: allCollections, error: e1 }, { data: memberships, error: e2 }] =
    await Promise.all([
      supabase
        .from('collections')
        .select('id, name')
        .eq('is_want_to_read', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('collection_books')
        .select('collection_id, id')
        .eq('book_id', bookId),
    ])

  if (e1) throw e1
  if (e2) throw e2

  const memberMap = new Map(
    memberships.map(m => [m.collection_id, m.id]),
  )

  return allCollections.map(c => ({
    id: c.id,
    name: c.name,
    inCollection: memberMap.has(c.id),
    collectionBookId: memberMap.get(c.id) ?? null,
  }))
}
