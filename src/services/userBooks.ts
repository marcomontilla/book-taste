import { supabase } from '@/lib/supabase'

export async function getLibrary() {
  const { data, error } = await supabase
    .from('user_books')
    .select('*, book:books(*)')
    .order('date_added', { ascending: false })
  if (error) throw error
  return data
}

export async function getUserBook(userBookId: string) {
  const { data, error } = await supabase
    .from('user_books')
    .select('*, book:books(*)')
    .eq('id', userBookId)
    .single()
  if (error) throw error
  return data
}

export async function addToLibrary(bookId: string) {
  const { data, error } = await supabase
    .from('user_books')
    .insert({ book_id: bookId })
    .select('*, book:books(*)')
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Book is already in your library')
    throw error
  }
  return data
}

export async function updateProgress(userBookId: string, currentPage: number) {
  const { error } = await supabase
    .from('user_books')
    .update({ current_page: currentPage })
    .eq('id', userBookId)
  if (error) throw error
}

export async function setCompleted(userBookId: string, completed: boolean) {
  const { error } = await supabase
    .from('user_books')
    .update({ status: completed ? 'completed' : 'reading' })
    .eq('id', userBookId)
  if (error) throw error
}

export async function removeFromLibrary(userBookId: string) {
  const { error } = await supabase
    .from('user_books')
    .delete()
    .eq('id', userBookId)
  if (error) throw error
}

export async function updateRating(userBookId: string, rating: number | null) {
  const { error } = await supabase
    .from('user_books')
    .update({ rating })
    .eq('id', userBookId)
  if (error) throw error
}

export async function toggleFavorite(userBookId: string, isFavorite: boolean) {
  const { error } = await supabase
    .from('user_books')
    .update({ is_favorite: isFavorite })
    .eq('id', userBookId)
  if (error) throw error
}
