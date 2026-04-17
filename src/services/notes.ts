import { supabase } from '@/lib/supabase'

export async function getNotes(userBookId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_book_id', userBookId)
    .order('page_number', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function createNote(
  userBookId: string,
  content: string,
  pageNumber?: number,
) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_book_id: userBookId, content, page_number: pageNumber ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNote(
  noteId: string,
  content: string,
  pageNumber: number | null,
) {
  const { error } = await supabase
    .from('notes')
    .update({ content, page_number: pageNumber })
    .eq('id', noteId)
  if (error) throw error
}

export async function deleteNote(noteId: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
  if (error) throw error
}
