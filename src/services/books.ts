import { supabase } from '@/lib/supabase'
import type { Book, BookSearchResult, OLBookDetails, OLSearchDoc } from '@/types'

const OL_SEARCH = 'https://openlibrary.org/search.json'
const OL_COVERS = 'https://covers.openlibrary.org/b/id'

export function olCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${OL_COVERS}/${coverId}-${size}.jpg`
}

function extractIsbns(raw: string[] | undefined) {
  if (!raw?.length) return { isbn10: null, isbn13: null }
  const isbn13 = raw.find(i => /^\d{13}$/.test(i)) ?? null
  const isbn10 = raw.find(i => /^[\dX]{10}$/.test(i)) ?? null
  return { isbn10, isbn13 }
}

// Best-effort series extraction from title strings like:
//   "Harry Potter and the Sorcerer's Stone (Harry Potter, #1)"
//   "Dune (Dune Chronicles, #1)"
function parseSeriesFromTitle(title: string): {
  cleanTitle: string
  seriesName: string | null
  seriesNumber: number | null
} {
  const match = title.match(/^(.+?)\s*\(([^,)]+),?\s*(?:Book\s*|Vol(?:ume)?\.?\s*)?#?(\d+(?:\.\d+)?)\)\s*$/)
  if (match) {
    return {
      cleanTitle: match[1].trim(),
      seriesName: match[2].trim(),
      seriesNumber: parseFloat(match[3]),
    }
  }
  return { cleanTitle: title, seriesName: null, seriesNumber: null }
}

function normalizeDoc(doc: OLSearchDoc): BookSearchResult {
  const { isbn10, isbn13 } = extractIsbns(doc.isbn)

  // Prefer OL series field; fall back to title parsing
  let seriesName: string | null = doc.series?.[0] ?? null
  let seriesNumber: number | null = null
  let title = doc.title

  if (!seriesName) {
    const parsed = parseSeriesFromTitle(title)
    title = parsed.cleanTitle
    seriesName = parsed.seriesName
    seriesNumber = parsed.seriesNumber
  }

  return {
    olKey: doc.key,
    title,
    subtitle: doc.subtitle ?? null,
    authors: doc.author_name ?? [],
    coverUrl: doc.cover_i != null ? olCoverUrl(doc.cover_i) : null,
    publishYear: doc.first_publish_year ?? null,
    isbn10,
    isbn13,
    pageCount: doc.number_of_pages_median ?? null,
    seriesName,
    seriesNumber,
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

// ISBN lookup for barcode scanning.
// Checks local DB first to avoid unnecessary OL calls.
// Falls back to OL search-by-ISBN which reuses existing normalization.
export async function lookupByIsbn(isbn: string): Promise<BookSearchResult | null> {
  const cleaned = isbn.replace(/[-\s]/g, '')
  const col = cleaned.length === 13 ? 'isbn_13' : 'isbn_10'

  // 1. Check local DB
  const { data: local } = await supabase
    .from('books')
    .select('*')
    .eq(col, cleaned)
    .maybeSingle()

  if (local) {
    return {
      olKey: local.open_library_key ?? '',
      title: local.title,
      subtitle: local.subtitle,
      authors: local.authors,
      coverUrl: local.cover_url,
      publishYear: null,
      isbn10: local.isbn_10,
      isbn13: local.isbn_13,
      pageCount: local.page_count,
      seriesName: local.series_name,
      seriesNumber: local.series_number,
    }
  }

  // 2. Fall back to OL search — searching by ISBN returns the exact edition
  try {
    const results = await searchBooks(cleaned)
    return results[0] ?? null
  } catch {
    return null
  }
}

export async function fetchOLDetails(
  book: Pick<Book, 'title' | 'authors' | 'isbn_13' | 'isbn_10'>,
): Promise<OLBookDetails> {
  const params = new URLSearchParams({
    limit: '1',
    fields: 'ratings_average,ratings_count,publisher,language,subject,ebook_access,first_publish_year',
  })
  const isbn = book.isbn_13 ?? book.isbn_10
  if (isbn) {
    params.set('q', isbn)
  } else {
    params.set('title', book.title)
    if (book.authors[0]) params.set('author', book.authors[0])
  }
  const res = await fetch(`${OL_SEARCH}?${params}`)
  if (!res.ok) throw new Error('OL lookup failed')
  const json = await res.json()
  const doc: OLSearchDoc = json.docs?.[0] ?? {}
  return {
    ratingsAverage:
      typeof doc.ratings_average === 'number'
        ? Math.round(doc.ratings_average * 10) / 10
        : null,
    ratingsCount: doc.ratings_count ?? null,
    publishers: Array.isArray(doc.publisher)
      ? [...new Set<string>(doc.publisher)].slice(0, 2)
      : [],
    languages: Array.isArray(doc.language) ? doc.language.slice(0, 4) : [],
    subjects: Array.isArray(doc.subject) ? doc.subject.slice(0, 10) : [],
    firstPublishYear: doc.first_publish_year ?? null,
    ebookAccess: doc.ebook_access ?? null,
  }
}

export async function fetchAuthorWorks(
  authorName: string,
  excludeTitle: string,
): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    author: authorName,
    fields: 'key,title,subtitle,cover_i,first_publish_year,author_name,number_of_pages_median,isbn,series',
    sort: 'editions',
    limit: '14',
  })
  try {
    const res = await fetch(`${OL_SEARCH}?${params}`)
    if (!res.ok) return []
    const json = await res.json()
    const seen = new Set<string>()
    return (json.docs as OLSearchDoc[])
      .map(normalizeDoc)
      .filter(b => {
        const key = b.title.toLowerCase()
        if (key === excludeTitle.toLowerCase()) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 8)
  } catch {
    return []
  }
}

export async function upsertBook(result: BookSearchResult) {
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
      series_number: result.seriesNumber,
      isbn_10: result.isbn10,
      isbn_13: result.isbn13,
      open_library_key: result.olKey,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
