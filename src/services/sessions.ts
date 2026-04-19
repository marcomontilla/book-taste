import { supabase } from '@/lib/supabase'

export async function logSession(userBookId: string, pageAt: number) {
  const { error } = await supabase
    .from('reading_sessions')
    .insert({ user_book_id: userBookId, page_at: pageAt })
  if (error) throw error
}
