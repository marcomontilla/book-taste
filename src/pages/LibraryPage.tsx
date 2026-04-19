import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookCard } from '@/components/books/BookCard'
import { useLibrary } from '@/hooks/useLibrary'
import { toggleFavorite } from '@/services/userBooks'
import type { UserBookWithBook } from '@/types'
import styles from './LibraryPage.module.css'

type Filter = 'all' | 'reading' | 'completed' | 'favorites'
type Sort = 'recent' | 'title' | 'progress' | 'rating'

function sortBooks(books: UserBookWithBook[], sort: Sort): UserBookWithBook[] {
  return [...books].sort((a, b) => {
    if (sort === 'title') return a.book.title.localeCompare(b.book.title)
    if (sort === 'rating') {
      const ra = a.rating ?? -1
      const rb = b.rating ?? -1
      return rb - ra
    }
    if (sort === 'progress') {
      const pctA = (a.total_pages ?? a.book.page_count)
        ? a.current_page / (a.total_pages ?? a.book.page_count ?? 1)
        : 0
      const pctB = (b.total_pages ?? b.book.page_count)
        ? b.current_page / (b.total_pages ?? b.book.page_count ?? 1)
        : 0
      return pctB - pctA
    }
    return new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
  })
}

export function LibraryPage() {
  const { userBooks, loading, error, refetch } = useLibrary()
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recent')
  const { t } = useTranslation()
  const navigate = useNavigate()

  const readingCount = userBooks.filter(ub => ub.status === 'reading').length

  const filtered = (() => {
    if (filter === 'favorites') return userBooks.filter(ub => ub.is_favorite)
    if (filter === 'all') return userBooks
    return userBooks.filter(ub => ub.status === filter)
  })()

  const visible = sortBooks(filtered, sort)

  const filterLabels: Record<Filter, string> = {
    all: t('library.filter.all'),
    reading: t('library.filter.reading'),
    completed: t('library.filter.completed'),
    favorites: t('library.filter.favorites'),
  }

  const handleFavoriteToggle = useCallback(async (id: string, isFavorite: boolean) => {
    try {
      await toggleFavorite(id, isFavorite)
      await refetch()
    } catch {
      // silent — user can retry
    }
  }, [refetch])

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('library.title')}</h1>
          {readingCount > 0 && (
            <p className={styles.readingCount}>
              {t('library.readingCount', { count: readingCount })}
            </p>
          )}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={() => navigate('/search')}
        >
          {t('library.add')}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {!loading && userBooks.length > 0 && (
        <>
          <div className={styles.filters}>
            {(['all', 'reading', 'completed', 'favorites'] as Filter[]).map(f => (
              <button
                key={f}
                className={[styles.filterBtn, filter === f ? styles.filterBtnActive : ''].join(' ')}
                onClick={() => setFilter(f)}
              >
                {filterLabels[f]}
                {f === 'reading' && (
                  <span className={styles.filterCount}>
                    {userBooks.filter(ub => ub.status === 'reading').length}
                  </span>
                )}
                {f === 'completed' && (
                  <span className={styles.filterCount}>
                    {userBooks.filter(ub => ub.status === 'completed').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.sortRow}>
            <label className={styles.sortLabel} htmlFor="sort-select">{t('library.sort.label')}</label>
            <select
              id="sort-select"
              className={styles.sortSelect}
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
            >
              <option value="recent">{t('library.sort.recent')}</option>
              <option value="title">{t('library.sort.title')}</option>
              <option value="progress">{t('library.sort.progress')}</option>
              <option value="rating">{t('library.sort.rating')}</option>
            </select>
          </div>
        </>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : userBooks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📚</span>
          <p className="empty-state-title">{t('library.empty.title')}</p>
          <p className="empty-state-body">{t('library.empty.body')}</p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', marginTop: '0.5rem' }}
            onClick={() => navigate('/search')}
          >
            {t('library.addFirst')}
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔖</span>
          <p className="empty-state-title">
            {filter === 'favorites'
              ? t('library.emptyFavorites')
              : t('library.emptyFilter.title', { filter: filterLabels[filter].toLowerCase() })}
          </p>
        </div>
      ) : (
        <ul className={styles.bookList}>
          {visible.map(ub => (
            <li key={ub.id}>
              <BookCard
                userBook={ub}
                onFavoriteToggle={handleFavoriteToggle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
