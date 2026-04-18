import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { BookCover } from '@/components/books/BookCover'
import { AuthorWorksSection } from '@/components/books/AuthorWorksSection'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { NoteList } from '@/components/notes/NoteList'
import { IntelligencePanel } from '@/components/intelligence/IntelligencePanel'
import { useUserBook } from '@/hooks/useUserBook'
import { useDebounce } from '@/hooks/useDebounce'
import {
  getLibrary,
  updateProgress,
  setCompleted,
  removeFromLibrary,
} from '@/services/userBooks'
import {
  getCollectionsForBook,
  addBookToCollection,
  removeBookFromCollection,
} from '@/services/collections'
import { fetchOLDetails } from '@/services/books'
import { useToast } from '@/contexts/ToastContext'
import type { BookCollectionStatus, OLBookDetails } from '@/types'
import styles from './BookDetailPage.module.css'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

// OL subjects include internal noise like "Serie:Percy_Jackson_and_the_Olympians",
// "nyt:series_books", "Accessible book", etc. Strip, normalize, deduplicate.
function normalizeSubjects(raw: string[]): string[] {
  const seen = new Set<string>()
  return raw
    .filter(s => {
      if (s.length < 3 || s.length > 45) return false
      if (s.includes('_')) return false                            // internal OL keys
      if (/^[A-Za-z]+:[A-Za-z]/i.test(s)) return false           // Key:Value pattern
      if (/^(accessible|protected|internet archive|in library|overdrive|nyt\b)/i.test(s)) return false
      return true
    })
    .map(s =>
      s
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    )
    .filter(s => {
      const key = s.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 6)
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const { userBook, setUserBook, loading, error } = useUserBook(id!)

  const [currentPage, setCurrentPage] = useState(0)
  const debouncedPage = useDebounce(currentPage, 1000)

  const [collectionStatus, setCollectionStatus] = useState<BookCollectionStatus[]>([])
  const [completedBooks, setCompletedBooks] = useState<{ title: string; authors: string[] }[]>([])
  const [olDetails, setOlDetails] = useState<OLBookDetails | null>(null)
  const [coverZoomed, setCoverZoomed] = useState(false)

  useEffect(() => {
    if (userBook) setCurrentPage(userBook.current_page)
  }, [userBook])

  useEffect(() => {
    if (!userBook) return
    getCollectionsForBook(userBook.book_id)
      .then(setCollectionStatus)
      .catch(() => {})
  }, [userBook])

  useEffect(() => {
    getLibrary()
      .then(books => {
        setCompletedBooks(
          books
            .filter(ub => ub.status === 'completed')
            .map(ub => ({ title: ub.book.title, authors: ub.book.authors })),
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!userBook) return
    const b = userBook.book
    fetchOLDetails({
      title: b.title,
      authors: b.authors,
      isbn_13: b.isbn_13,
      isbn_10: b.isbn_10,
      open_library_key: b.open_library_key,
    })
      .then(setOlDetails)
      .catch(() => setOlDetails(null))
  }, [userBook])

  useEffect(() => {
    if (!userBook || debouncedPage === userBook.current_page) return
    updateProgress(userBook.id, debouncedPage).catch(() =>
      showToast('Could not save progress', 'error'),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPage])

  // Close lightbox on Escape
  useEffect(() => {
    if (!coverZoomed) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setCoverZoomed(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [coverZoomed])

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
      showToast(checked ? t('book.markedCompleted') : t('book.movedToReading'))
    } catch {
      showToast('Could not update status', 'error')
    }
  }, [userBook, setUserBook, showToast, t])

  const handleRemoveFromLibrary = useCallback(async () => {
    if (!userBook) return
    if (!window.confirm(t('book.confirmRemove'))) return
    try {
      await removeFromLibrary(userBook.id)
      showToast('Removed from library')
      navigate('/library')
    } catch {
      showToast('Could not remove book', 'error')
    }
  }, [userBook, navigate, showToast, t])

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
        <p className="empty-state-title">{t('library.title')}</p>
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/library')}>
          {t('common.back')}
        </button>
      </div>
    )
  }

  const { book, status } = userBook
  const effectiveTotal = userBook.total_pages ?? book.page_count
  const authors = book.authors.join(', ')
  const largeCoverUrl = book.cover_url?.replace(/-M\.jpg$/, '-L.jpg') ?? book.cover_url

  const subjects = normalizeSubjects(olDetails?.subjects ?? [])

  const showEbook =
    olDetails?.ebookAccess &&
    olDetails.ebookAccess !== 'no_ebook' &&
    book.open_library_key

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← {t('common.back')}
      </button>

      {/* Cover lightbox */}
      {coverZoomed && largeCoverUrl && (
        <div className={styles.lightbox} onClick={() => setCoverZoomed(false)}>
          <button className={styles.lightboxClose} onClick={() => setCoverZoomed(false)} aria-label={t('common.done')}>
            <X size={22} strokeWidth={2} />
          </button>
          <img
            src={largeCoverUrl}
            alt={`Cover of ${book.title}`}
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Hero */}
      <div className={styles.hero}>
        <button
          className={styles.coverBtn}
          onClick={() => book.cover_url && setCoverZoomed(true)}
          aria-label={t('book.zoomCover')}
          title={t('book.zoomCover')}
        >
          <BookCover url={book.cover_url} title={book.title} size="lg" />
        </button>

        <div className={styles.heroInfo}>
          <h1 className={styles.title}>{book.title}</h1>
          {book.subtitle && <p className={styles.subtitle}>{book.subtitle}</p>}
          {authors && <p className={styles.author}>{authors}</p>}
          {(book.series_name ?? olDetails?.series) && (
            <p className={styles.series}>
              <span className={styles.seriesLabel}>Series</span>
              {book.series_name ?? olDetails?.series}
              {book.series_number != null ? ` · #${book.series_number}` : ''}
            </p>
          )}

          <div className={styles.metaRow}>
            {(olDetails?.firstPublishYear ?? book.page_count) && (
              <>
                {olDetails?.firstPublishYear && (
                  <span className={styles.metaItem}>{olDetails.firstPublishYear}</span>
                )}
                {book.page_count && (
                  <span className={styles.metaItem}>{book.page_count} {t('book.pages')}</span>
                )}
              </>
            )}
          </div>

          {olDetails?.ratingsAverage && (
            <p className={styles.rating}>
              ★ {olDetails.ratingsAverage}
              {olDetails.ratingsCount
                ? <span className={styles.ratingCount}> · {formatCount(olDetails.ratingsCount)} {t('book.ratings')}</span>
                : null}
            </p>
          )}

          {olDetails?.publishers && olDetails.publishers.length > 0 && (
            <p className={styles.meta}>{olDetails.publishers[0]}</p>
          )}

          {showEbook && (
            <a
              href={`https://openlibrary.org${book.open_library_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ebookBadge}
            >
              {t('book.ebookAvailable')}
            </a>
          )}
        </div>
      </div>

      {/* Categories */}
      {subjects.length > 0 && (
        <div className={styles.subjects}>
          {subjects.map(s => (
            <span key={s} className={styles.subject}>{s}</span>
          ))}
        </div>
      )}

      {/* Progress */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('book.progress')}</h2>

        <label className={styles.completedRow}>
          <input
            type="checkbox"
            checked={status === 'completed'}
            onChange={e => handleCompleteToggle(e.target.checked)}
            className={styles.checkbox}
          />
          <span>{status === 'completed' ? t('book.completed') : t('book.markCompleted')}</span>
        </label>

        <div className={status === 'completed' ? styles.progressDisabled : undefined}>
          {effectiveTotal ? (
            <div className={styles.progressArea}>
              <ProgressBar current={currentPage} total={effectiveTotal} showLabel />
              <div className={styles.pageInputRow}>
                <label className={styles.pageLabel} htmlFor="current-page">{t('book.currentPage')}</label>
                <input
                  id="current-page"
                  type="number"
                  className={`form-input ${styles.pageInput}`}
                  value={currentPage}
                  min={0}
                  max={effectiveTotal}
                  disabled={status === 'completed'}
                  onChange={e => setCurrentPage(Math.max(0, Number(e.target.value)))}
                />
                <span className={styles.pageMeta}>{t('book.of')} {effectiveTotal}</span>
              </div>
            </div>
          ) : (
            <div className={styles.pageInputRow}>
              <label className={styles.pageLabel} htmlFor="current-page">{t('book.currentPage')}</label>
              <input
                id="current-page"
                type="number"
                className={`form-input ${styles.pageInput}`}
                value={currentPage}
                min={0}
                disabled={status === 'completed'}
                onChange={e => setCurrentPage(Math.max(0, Number(e.target.value)))}
              />
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      {(book.description ?? olDetails?.description) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('book.about')}</h2>
          <p className={styles.description}>{book.description ?? olDetails?.description}</p>
        </section>
      )}

      {/* Collections */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('book.collections')}</h2>
        {collectionStatus.length === 0 ? (
          <p className={styles.collectionsHint}>{t('book.noCollections')}</p>
        ) : (
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
        )}
      </section>

      {/* Notes */}
      <section className={styles.section}>
        <NoteList userBookId={userBook.id} />
      </section>

      {/* Intelligence */}
      <section className={styles.section}>
        <IntelligencePanel userBook={userBook} completedBooks={completedBooks} />
      </section>

      {/* More by author */}
      {book.authors[0] && (
        <AuthorWorksSection authorName={book.authors[0]} excludeTitle={book.title} />
      )}

      {/* Danger zone */}
      <section className={styles.dangerZone}>
        <button className={styles.removeBtn} onClick={handleRemoveFromLibrary}>
          {t('book.removeFromLibrary')}
        </button>
      </section>
    </div>
  )
}
