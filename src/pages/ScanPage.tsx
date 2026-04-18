import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScannerView } from '@/components/scanner/ScannerView'
import { lookupByIsbn, upsertBook } from '@/services/books'
import { addToLibrary } from '@/services/userBooks'
import { useToast } from '@/contexts/ToastContext'
import type { ScanResult } from '@/services/scanner'
import type { BookSearchResult } from '@/types'
import styles from './ScanPage.module.css'

type ScanState =
  | { phase: 'scanning' }
  | { phase: 'looking_up'; isbn: string }
  | { phase: 'found'; book: BookSearchResult }
  | { phase: 'not_found'; isbn: string }
  | { phase: 'adding'; book: BookSearchResult }

export default function ScanPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [state, setState] = useState<ScanState>({ phase: 'scanning' })
  const [scannerActive, setScannerActive] = useState(true)
  const detectedRef = useRef(false)

  const handleDetect = useCallback(async (result: ScanResult) => {
    if (detectedRef.current) return
    const isbn = result.isbn13 ?? result.isbn10
    if (!isbn) return

    detectedRef.current = true
    setScannerActive(false)
    setState({ phase: 'looking_up', isbn })

    const book = await lookupByIsbn(isbn)
    if (book) {
      setState({ phase: 'found', book })
    } else {
      setState({ phase: 'not_found', isbn })
    }
  }, [])

  async function handleAdd(book: BookSearchResult) {
    setState({ phase: 'adding', book })
    try {
      const dbBook = await upsertBook(book)
      const userBook = await addToLibrary(dbBook.id)
      showToast(`"${book.title}" added to your library`)
      navigate(`/books/${userBook.id}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to add book', 'error')
      setState({ phase: 'found', book })
    }
  }

  function handleScanAgain() {
    detectedRef.current = false
    setState({ phase: 'scanning' })
    setScannerActive(true)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{t('scan.title')}</h1>

      <div className={styles.scannerWrap}>
        <ScannerView onDetect={handleDetect} active={scannerActive} />
      </div>

      {state.phase === 'scanning' && (
        <p className={styles.hint}>{t('scan.hint')}</p>
      )}

      {state.phase === 'looking_up' && (
        <div className={styles.status}>
          <div className="spinner" />
          <span>{t('scan.lookingUp', { isbn: state.isbn })}</span>
        </div>
      )}

      {state.phase === 'not_found' && (
        <div className={styles.resultCard}>
          <p className={styles.notFound}>{t('scan.notFound', { isbn: state.isbn })}</p>
          <button className="btn btn-secondary" onClick={handleScanAgain}>{t('scan.scanAgain')}</button>
        </div>
      )}

      {(state.phase === 'found' || state.phase === 'adding') && (
        <div className={styles.resultCard}>
          <div className={styles.bookInfo}>
            {state.book.coverUrl && (
              <img src={state.book.coverUrl} alt="" className={styles.cover} />
            )}
            <div className={styles.bookMeta}>
              <p className={styles.bookTitle}>{state.book.title}</p>
              <p className={styles.bookAuthor}>{state.book.authors.join(', ')}</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              onClick={() => handleAdd(state.book)}
              disabled={state.phase === 'adding'}
            >
              {state.phase === 'adding' ? t('scan.adding') : t('scan.addToLibrary')}
            </button>
            <button className="btn btn-secondary" onClick={handleScanAgain}>
              {t('scan.scanAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
