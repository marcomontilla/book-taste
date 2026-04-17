import { supabase } from '@/lib/supabase'
import type { BookSearchResult, OLSearchDoc } from '@/types'

const OL_SEARCH = 'https://openlibrary.org/search.json'
const OL_COVERS = 'https://covers.openlibrary.org/b/id'

export function olCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${OL_COVERS}/${coverId}-${size}.jpg`
}

function extractIsbns(raw: string[] | undefined) {
  if (!raw?.length) return { isbn10: null, isbn13: null }
  // isbn13: exactly 13 digits; isbn10: exactly 10 chars (digits + optional trailing X)
  const isbn13 = raw.find(i => /^\d{13}$/.test(i)) ?? null
  const isbn10 = raw.find(i => /^[\dX]{10}$/.test(i)) ?? null
  return { isbn10, isbn13 }
}

function normalizeDoc(doc: OLSearchDoc): BookSearchResult {
  const { isbn10, isbn13 } = extractIsbns(doc.isbn)
  return {
    olKey: doc.key,
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    authors: doc.author_name ?? [],
    coverUrl: doc.cover_i != null ? olCoverUrl(doc.cover_i) : null,
    publishYear: doc.first_publish_year ?? null,
    isbn10,
    isbn13,
    pageCount: doc.number_of_pages_median ?? null,
    seriesName: doc.series?.[0] ?? null,
  }
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '20',
    fields: 'key,title,subtitle,author_name,cover_i,first_publish_year,isbn,number_of_pages_median,series',
  })
  const res = await fetch(`${OL_SEARCH}?${params}`)
  if (!res.ok) throw new Error('Search failed. Check your connection and try again.')
  const json = await res.json()
  return (json.docs as OLSearchDoc[]).map(normalizeDoc)
}

export async function upsertBook(result: BookSearchResult) {
  // Try to find existing book by ISBN (preferred) or OL key (fallback)
  let q = supabase.from('books').select('*')
  if (result.isbn13) {
    q = q.eq('isbn_13', result.isbn13)
  } else if (result.isbn10) {
    q = q.eq('isbn_10', result.isbn10)
  } else {
    q = q.eq('open_library_key', result.olKey)
  }

  const { data: existing } = await q.maybeSingle()
  if (existing) return existing

  const { data, error } = await supabase
    .from('books')
    .insert({
      title: result.title,
      subtitle: result.subtitle,
      authors: result.authors,
      cover_url: result.coverUrl,
      page_count: result.pageCount,
      series_name: result.seriesName,
      isbn_10: result.isbn10,
      isbn_13: result.isbn13,
      open_library_key: result.olKey,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
