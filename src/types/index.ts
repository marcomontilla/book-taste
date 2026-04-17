export type { Database } from './database'

export type ReadingStatus = 'reading' | 'completed'

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
  open_library_key: string | null
  created_at: string
}

export interface UserBookWithBook {
  id: string
  user_id: string
  book_id: string
  current_page: number
  total_pages: number | null
  status: ReadingStatus
  date_added: string
  completed_at: string | null
  book: Book
}

export interface WantToReadItem {
  collectionBookId: string
  bookId: string
  addedAt: string
  book: Book
}

export interface CollectionSummary {
  id: string
  name: string
  description: string | null
  is_want_to_read: boolean
  created_at: string
  updated_at: string
  bookCount: number
}

export interface CollectionWithBooks {
  id: string
  name: string
  description: string | null
  is_want_to_read: boolean
  created_at: string
  updated_at: string
  books: { collectionBookId: string; book: Book }[]
}

export interface Note {
  id: string
  user_id: string
  user_book_id: string
  content: string
  page_number: number | null
  created_at: string
  updated_at: string
}

// Open Library raw search doc
export interface OLSearchDoc {
  key: string
  title: string
  subtitle?: string
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
  isbn?: string[]
  number_of_pages_median?: number
  series?: string[]
}

// Normalised result ready for display + upsert
export interface BookSearchResult {
  olKey: string
  title: string
  subtitle: string | null
  authors: string[]
  coverUrl: string | null
  publishYear: number | null
  isbn10: string | null
  isbn13: string | null
  pageCount: number | null
  seriesName: string | null
}

// Represents a collection membership state on the book detail page
export interface BookCollectionStatus {
  id: string
  name: string
  inCollection: boolean
  collectionBookId: string | null
}
