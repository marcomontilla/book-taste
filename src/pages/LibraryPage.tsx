import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookCard } from '@/components/books/BookCard'
import { useLibrary } from '@/hooks/useLibrary'
import styles from './Page.module.css'

type Filter = 'all' | 'reading' | 'completed'

export function LibraryPage() {
  const { userBooks, loading, error } = useLibrary()
  const [filter, setFilter] = useState<Filter>('all')
  const { t } = useTranslation()
  const navigate = useNavigate()

  const visible = filter === 'all'
    ? userBooks
    : userBooks.filter(ub => ub.status === filter)

  const filterLabels: Record<Filter, string> = {
    all: t('library.filter.all'),
    reading: t('library.filter.reading'),
    completed: t('library.filter.completed'),
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('library.title')}</h1>
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
        <div className={styles.filters}>
          {(['all', 'reading', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              className={[styles.filterBtn, filter === f ? styles.filterBtnActive : ''].join(' ')}
              onClick={() => setFilter(f)}
            >
              {filterLabels[f]}
              {f !== 'all' && (
                <span className={styles.filterCount}>
                  {userBooks.filter(ub => ub.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
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
          <p className="empty-state-title">{t('library.emptyFilter.title', { filter: filterLabels[filter].toLowerCase() })}</p>
        </div>
      ) : (
        <ul className={styles.bookList}>
          {visible.map(ub => (
            <li key={ub.id}>
              <BookCard userBook={ub} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
