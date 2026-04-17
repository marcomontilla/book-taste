import { useNavigate } from 'react-router-dom'
import { BookCover } from '@/components/books/BookCover'
import { useWantToRead } from '@/hooks/useWantToRead'
import { removeFromWantToRead } from '@/services/collections'
import { addToLibrary } from '@/services/userBooks'
import { useToast } from '@/contexts/ToastContext'
import styles from './WantToReadPage.module.css'
import pageStyles from './Page.module.css'

export function WantToReadPage() {
  const { items, loading, error, refetch } = useWantToRead()
  const { showToast } = useToast()
  const navigate = useNavigate()

  async function handleMoveToLibrary(bookId: string, collectionBookId: string) {
    try {
      await addToLibrary(bookId)
      await removeFromWantToRead(collectionBookId)
      showToast('Moved to library')
      refetch()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not move book', 'error')
    }
  }

  async function handleRemove(collectionBookId: string) {
    try {
      await removeFromWantToRead(collectionBookId)
      showToast('Removed')
      refetch()
    } catch {
      showToast('Could not remove book', 'error')
    }
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>
        <h1 className={pageStyles.pageTitle}>Want to Read</h1>
        <button
          className="btn btn-outline"
          style={{ width: 'auto' }}
          onClick={() => navigate('/search')}
        >
          + Add
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔖</span>
          <p className="empty-state-title">Nothing saved yet</p>
          <p className="empty-state-body">
            Use the Search page to add books you want to read later.
          </p>
        </div>
      ) : (
        <ul className={pageStyles.bookList}>
          {items.map(item => (
            <li key={item.collectionBookId} className={styles.item}>
              <BookCover url={item.book.cover_url} title={item.book.title} size="md" />
              <div className={styles.info}>
                <p className={styles.title}>{item.book.title}</p>
                {item.book.authors.length > 0 && (
                  <p className={styles.author}>{item.book.authors.slice(0, 2).join(', ')}</p>
                )}
                {item.book.series_name && (
                  <p className={styles.series}>{item.book.series_name}</p>
                )}
                <div className={styles.actions}>
                  <button
                    className="btn btn-primary"
                    style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.4rem 0.875rem' }}
                    onClick={() => handleMoveToLibrary(item.bookId, item.collectionBookId)}
                  >
                    Start reading
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(item.collectionBookId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
