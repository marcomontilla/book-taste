import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookCover } from '@/components/books/BookCover'
import { useWantToRead } from '@/hooks/useWantToRead'
import type { WantToReadItem } from '@/types'
import styles from './WantToReadPage.module.css'

type Sort = 'recent' | 'title'

function sortItems(items: WantToReadItem[], sort: Sort): WantToReadItem[] {
  return [...items].sort((a, b) => {
    if (sort === 'title') return a.book.title.localeCompare(b.book.title)
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  })
}

export function WantToReadPage() {
  const { items, loading, error } = useWantToRead()
  const [sort, setSort] = useState<Sort>('recent')
  const { t } = useTranslation()
  const navigate = useNavigate()

  const visible = sortItems(items, sort)

  function handleItemClick(item: WantToReadItem) {
    navigate('/books/preview', {
      state: {
        book: {
          title: item.book.title,
          subtitle: item.book.subtitle,
          authors: item.book.authors,
          coverUrl: item.book.cover_url,
          olKey: item.book.open_library_key,
          isbn13: item.book.isbn_13,
          isbn10: item.book.isbn_10,
          publishYear: null,
          pageCount: item.book.page_count,
          seriesName: item.book.series_name,
          seriesNumber: item.book.series_number,
        },
        bookId: item.bookId,
        wtrCollectionBookId: item.collectionBookId,
      },
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('wtr.title')}</h1>
          {items.length > 0 && (
            <p className={styles.count}>{t('wtr.bookCount', { count: items.length })}</p>
          )}
        </div>
        <button
          className="btn btn-outline"
          style={{ width: 'auto' }}
          onClick={() => navigate('/search')}
        >
          {t('wtr.add')}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {!loading && items.length > 0 && (
        <div className={styles.sortRow}>
          <label className={styles.sortLabel} htmlFor="wtr-sort">{t('wtr.sort.label')}</label>
          <select
            id="wtr-sort"
            className={styles.sortSelect}
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
          >
            <option value="recent">{t('wtr.sort.recent')}</option>
            <option value="title">{t('wtr.sort.title')}</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔖</span>
          <p className="empty-state-title">{t('wtr.empty.title')}</p>
          <p className="empty-state-body">{t('wtr.empty.body')}</p>
        </div>
      ) : (
        <ul className={styles.bookList}>
          {visible.map(item => (
            <li key={item.collectionBookId}>
              <button
                className={styles.item}
                onClick={() => handleItemClick(item)}
              >
                <BookCover url={item.book.cover_url} title={item.book.title} size="md" />
                <div className={styles.info}>
                  <p className={styles.title}>{item.book.title}</p>
                  {item.book.subtitle && (
                    <p className={styles.subtitle}>{item.book.subtitle}</p>
                  )}
                  {item.book.authors.length > 0 && (
                    <p className={styles.author}>{item.book.authors.slice(0, 2).join(', ')}</p>
                  )}
                  {item.book.series_name && (
                    <p className={styles.series}>{item.book.series_name}</p>
                  )}
                  {item.book.page_count && (
                    <p className={styles.meta}>{item.book.page_count} {t('book.pages')}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
