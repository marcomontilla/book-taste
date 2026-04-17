export type { Database } from './database'

export type ReadingStatus = 'reading' | 'completed'

export interface UserBook {
  id: string
  book: Book
  current_page: number
  total_pages: number | null
  status: ReadingStatus
  date_added: string
  completed_at: string | null
}

export interface Book {
  id: string
  title: string
  subtitle: string | null
  authors: string[]
  cover_url: string | null
  description: string | null
  page_count: number | null
  series_name: string | null
  series_number: number | null
  isbn_10: string | null
  isbn_13: string | null
}

export interface Collection {
  id: string
  name: string
  description: string | null
  is_want_to_read: boolean
  created_at: string
}

export interface Note {
  id: string
  user_book_id: string
  content: string
  page_number: number | null
  created_at: string
  updated_at: string
}
