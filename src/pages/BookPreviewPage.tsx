import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { BookCover } from '@/components/books/BookCover'
import { upsertBook, fetchOLDetails } from '@/services/books'
import { addToLibrary } from '@/services/userBooks'
import { addToWantToRead, removeFromWantToRead } from '@/services/collections'
import { useToast } from '@/contexts/ToastContext'
import type { BookSearchResult, OLBookDetails } from '@/types'
import styles from './BookPreviewPage.module.css'

interface LocationState {
  book: BookSearchResult
  bookId?: string              // already upserted in DB (e.g. WTR items — skip upsert)
  wtrCollectionBookId?: string // currently in WTR
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export function BookPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const state = location.state as LocationState | null

  const [olDetails, setOlDetails] = useState<OLBookDetails | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [wtrLoading, setWtrLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

  const book = state?.book
  const bookId = state?.bookId
  const wtrCollectionBookId = state?.wtrCollectionBookId

  useEffect(() => {
    if (!book) return
    fetchOLDetails({
      title: book.title,
      authors: book.authors,
      isbn_13: book.isbn13,
      isbn_10: book.isbn10,
      open_library_key: book.olKey,
    })
      .then(setOlDetails)
      .catch(() => {})
  }, [book?.olKey])

  if (!book) {
    navigate(-1)
    return null
  }

  const description = olDetails?.description ?? null
  const paragraphs = description ? description.split('\n\n').filter(Boolean) : []
  const seriesLabel = book.seriesName ?? olDetails?.series

  async function getOrUpsertBookId(): Promise<string> {
    if (bookId) return bookId
    const upserted = await upsertBook(book!)
    return upserted.id
  }

  async function handleAddToLibrary() {
    if (libraryLoading) return
    setLibraryLoading(true)
    try {
      const dbBookId = await getOrUpsertBookId()
      const userBook = await addToLibrary(dbBookId)
      if (wtrCollectionBookId) await removeFromWantToRead(wtrCollectionBookId)
      navigate(`/books/${userBook.id}`, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not add to library', 'error')
      setLibraryLoading(false)
    }
  }

  async function handleAddToWTR() {
    if (wtrLoading) return
    setWtrLoading(true)
    try {
      const dbBookId = await getOrUpsertBookId()
      await addToWantToRead(dbBookId)
      showToast('Saved to Want to Read')
      navigate(-1)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save', 'error')
      setWtrLoading(false)
    }
  }

  async function handleRemoveFromWTR() {
    if (!wtrCollectionBookId || removeLoading) return
    setRemoveLoading(true)
    try {
      await removeFromWantToRead(wtrCollectionBookId)
      showToast('Removed from Want to Read')
      navigate(-1)
    } catch {
      showToast('Could not remove', 'error')
      setRemoveLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2} /> Back
      </button>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.coverWrap}>
          <BookCover url={book.coverUrl} title={book.title} size="lg" />
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.title}>{book.title}</h1>
          {book.subtitle && <p className={styles.subtitle}>{book.subtitle}</p>}
          {book.authors.length > 0 && (
            <p className={styles.author}>{book.authors.join(', ')}</p>
          )}
          {seriesLabel && (
            <p className={styles.series}>
              <span className={styles.seriesLabel}>{t('book.series')}</span> {seriesLabel}
            </p>
          )}
          <div className={styles.metaRow}>
            {(olDetails?.firstPublishYear ?? book.publishYear) && (
              <span className={styles.metaItem}>{olDetails?.firstPublishYear ?? book.publishYear}</span>
            )}
            {book.pageCount && (
              <span className={styles.metaItem}>{book.pageCount} pages</span>
            )}
          </div>
          {olDetails?.ratingsAverage && (
            <p className={styles.rating}>
              ★ {olDetails.ratingsAverage}
              {olDetails.ratingsCount && (
                <span className={styles.ratingCount}> · {formatCount(olDetails.ratingsCount)} ratings</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {wtrCollectionBookId ? (
          <>
            <button className="btn btn-primary" onClick={handleAddToLibrary} disabled={libraryLoading}>
              {libraryLoading ? '…' : 'Start Reading'}
            </button>
            <button className={`btn btn-outline ${styles.removeBtn}`} onClick={handleRemoveFromWTR} disabled={removeLoading}>
              {removeLoading ? '…' : 'Remove from Want to Read'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={handleAddToLibrary} disabled={libraryLoading}>
              {libraryLoading ? '…' : 'Add to Library'}
            </button>
            <button className="btn btn-outline" onClick={handleAddToWTR} disabled={wtrLoading}>
              {wtrLoading ? '…' : 'Want to Read'}
            </button>
          </>
        )}
      </div>

      {/* Description */}
      {paragraphs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <div className={styles.descriptionBody}>
            {paragraphs.map((p, i) => (
              <p key={i} className={styles.description}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* Subjects */}
      {olDetails?.subjects && olDetails.subjects.length > 0 && (
        <div className={styles.subjects}>
          {olDetails.subjects.slice(0, 6).map(s => (
            <span key={s} className={styles.subject}>{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}
