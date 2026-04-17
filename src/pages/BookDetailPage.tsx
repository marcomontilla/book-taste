import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookCover } from '@/components/books/BookCover'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { NoteList } from '@/components/notes/NoteList'
import { useUserBook } from '@/hooks/useUserBook'
import { useDebounce } from '@/hooks/useDebounce'
import {
  updateProgress,
  setCompleted,
  removeFromLibrary,
} from '@/services/userBooks'
import {
  getCollectionsForBook,
  addBookToCollection,
  removeBookFromCollection,
} from '@/services/collections'
import { useToast } from '@/contexts/ToastContext'
import type { BookCollectionStatus } from '@/types'
import styles from './BookDetailPage.module.css'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { userBook, setUserBook, loading, error } = useUserBook(id!)

  // Progress (auto-save)
  const [currentPage, setCurrentPage] = useState(0)
  const debouncedPage = useDebounce(currentPage, 1000)

  // Collections membership
  const [collectionStatus, setCollectionStatus] = useState<BookCollectionStatus[]>([])

  // Sync local state from loaded data
  useEffect(() => {
    if (userBook) setCurrentPage(userBook.current_page)
  }, [userBook])

  // Load collection membership
  useEffect(() => {
    if (!userBook) return
    getCollectionsForBook(userBook.book_id)
      .then(setCollectionStatus)
      .catch(() => {})
  }, [userBook])

  // Auto-save progress
  useEffect(() => {
    if (!userBook || debouncedPage === userBook.current_page) return
    updateProgress(userBook.id, debouncedPage).catch(() =>
      showToast('Could not save progress', 'error'),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPage])

  const handleCompleteToggle = useCallback(async (checked: boolean) => {
    if (!userBook) return
    try {
      await setCompleted(userBook.id, checked)
      setUserBook(prev =>
        prev
          ? {
              ...prev,
              status: checked ? 'completed' : 'reading',
              completed_at: checked ? new Date().toISOString() : null,
            }
          : prev,
      )
      showToast(checked ? 'Marked as completed' : 'Moved back to reading')
    } catch {
      showToast('Could not update status', 'error')
    }
  }, [userBook, setUserBook, showToast])

  const handleRemoveFromLibrary = useCallback(async () => {
    if (!userBook) return
    if (!window.confirm('Remove this book from your library?')) return
    try {
      await removeFromLibrary(userBook.id)
      showToast('Removed from library')
      navigate('/library')
    } catch {
      showToast('Could not remove book', 'error')
    }
  }, [userBook, navigate, showToast])

  const handleCollectionToggle = useCallback(async (status: BookCollectionStatus) => {
    if (!userBook) return
    try {
      if (status.inCollection && status.collectionBookId) {
        await removeBookFromCollection(status.collectionBookId)
        setCollectionStatus(prev =>
          prev.map(s => s.id === status.id ? { ...s, inCollection: false, collectionBookId: null } : s),
        )
      } else {
        await addBookToCollection(status.id, userBook.book_id)
        // Reload to get new collectionBookId
        const fresh = await getCollectionsForBook(userBook.book_id)
        setCollectionStatus(fresh)
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update collection', 'error')
    }
  }, [userBook, showToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || !userBook) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📖</span>
        <p className="empty-state-title">Book not found</p>
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/library')}>
          Back to Library
        </button>
      </div>
    )
  }

  const { book, status } = userBook
  const effectiveTotal = userBook.total_pages ?? book.page_count
  const authors = book.authors.join(', ')

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Hero */}
      <div className={styles.hero}>
        <BookCover url={book.cover_url} title={book.title} size="lg" />
        <div className={styles.heroInfo}>
          <h1 className={styles.title}>{book.title}</h1>
          {book.subtitle && <p className={styles.subtitle}>{book.subtitle}</p>}
          {authors && <p className={styles.author}>{authors}</p>}
          {book.series_name && (
            <p className={styles.series}>
              {book.series_name}
              {book.series_number != null ? ` #${book.series_number}` : ''}
            </p>
          )}
          {book.page_count && (
            <p className={styles.meta}>{book.page_count} pages</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reading Progress</h2>

        <label className={styles.completedRow}>
          <input
            type="checkbox"
            checked={status === 'completed'}
            onChange={e => handleCompleteToggle(e.target.checked)}
            className={styles.checkbox}
          />
          <span>{status === 'completed' ? 'Completed ✓' : 'Mark as completed'}</span>
        </label>

        {effectiveTotal ? (
          <div className={styles.progressArea}>
            <ProgressBar current={currentPage} total={effectiveTotal} showLabel />
            <div className={styles.pageInputRow}>
              <label className={styles.pageLabel} htmlFor="current-page">Current page</label>
              <input
                id="current-page"
                type="number"
                className={`form-input ${styles.pageInput}`}
                value={currentPage}
                min={0}
                max={effectiveTotal}
                onChange={e => setCurrentPage(Math.max(0, Number(e.target.value)))}
              />
              <span className={styles.pageMeta}>of {effectiveTotal}</span>
            </div>
          </div>
        ) : (
          <div className={styles.pageInputRow}>
            <label className={styles.pageLabel} htmlFor="current-page">Current page</label>
            <input
              id="current-page"
              type="number"
              className={`form-input ${styles.pageInput}`}
              value={currentPage}
              min={0}
              onChange={e => setCurrentPage(Math.max(0, Number(e.target.value)))}
            />
          </div>
        )}
      </section>

      {/* Description */}
      {book.description && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.description}>{book.description}</p>
        </section>
      )}

      {/* Collections */}
      {collectionStatus.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Collections</h2>
          <div className={styles.collectionPills}>
            {collectionStatus.map(s => (
              <button
                key={s.id}
                className={[
                  styles.pill,
                  s.inCollection ? styles.pillActive : '',
                ].join(' ')}
                onClick={() => handleCollectionToggle(s)}
              >
                {s.inCollection ? '✓ ' : '+ '}{s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      <section className={styles.section}>
        <NoteList userBookId={userBook.id} />
      </section>

      {/* Danger zone */}
      <section className={styles.dangerZone}>
        <button className={styles.removeBtn} onClick={handleRemoveFromLibrary}>
          Remove from library
        </button>
      </section>
    </div>
  )
}
