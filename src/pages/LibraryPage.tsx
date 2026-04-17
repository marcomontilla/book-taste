import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookCard } from '@/components/books/BookCard'
import { useLibrary } from '@/hooks/useLibrary'
import styles from './Page.module.css'

type Filter = 'all' | 'reading' | 'completed'

export function LibraryPage() {
  const { userBooks, loading, error } = useLibrary()
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()

  const visible = filter === 'all'
    ? userBooks
    : userBooks.filter(ub => ub.status === filter)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Library</h1>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={() => navigate('/search')}
        >
          + Add
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
              {f === 'all' ? 'All' : f === 'reading' ? 'Reading' : 'Completed'}
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
          <p className="empty-state-title">Your library is empty</p>
          <p className="empty-state-body">Search for a book to get started.</p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', marginTop: '0.5rem' }}
            onClick={() => navigate('/search')}
          >
            + Add your first book
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔖</span>
          <p className="empty-state-title">No {filter} books</p>
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
