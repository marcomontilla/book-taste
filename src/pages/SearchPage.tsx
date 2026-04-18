import { useState, useRef, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchResultCard } from '@/components/search/SearchResultCard'
import { searchBooks } from '@/services/books'
import type { BookSearchResult } from '@/types'
import styles from './SearchPage.module.css'

export function SearchPage() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<BookSearchResult[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const data = await searchBooks(q)
      setResults(data)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          ref={inputRef}
          type="search"
          className={`form-input ${styles.input}`}
          placeholder={t('search.placeholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: 'auto', flexShrink: 0 }}
          disabled={loading || !query.trim()}
        >
          {loading ? '…' : t('search.searchBtn')}
        </button>
      </form>

      {error && <p className="form-error" style={{ marginTop: '0.5rem' }}>{error}</p>}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p className="empty-state-title">{t('search.noResults.title')}</p>
          <p className="empty-state-body">{t('search.noResults.body')}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className={styles.results}>
          {results.map(r => (
            <li key={r.olKey}>
              <SearchResultCard result={r} />
            </li>
          ))}
        </ul>
      )}

      {!searched && !loading && (
        <div className="empty-state">
          <span className="empty-state-icon">📖</span>
          <p className="empty-state-title">{t('search.initial.title')}</p>
          <p className="empty-state-body">{t('search.initial.body')}</p>
        </div>
      )}
    </div>
  )
}
