import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [state, setState] = useState<ScanState>({ phase: 'scanning' })
  const [scannerActive, setScannerActive] = useState(true)

  const handleDetect = useCallback(async (result: ScanResult) => {
    const isbn = result.isbn13 ?? result.isbn10
    if (!isbn) return

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
    setState({ phase: 'scanning' })
    setScannerActive(true)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Scan a book</h1>

      <div className={styles.scannerWrap}>
        <ScannerView onDetect={handleDetect} active={scannerActive} />
      </div>

      {state.phase === 'scanning' && (
        <p className={styles.hint}>Point your camera at the barcode on the back cover</p>
      )}

      {state.phase === 'looking_up' && (
        <div className={styles.status}>
          <div className="spinner" />
          <span>Looking up ISBN {state.isbn}…</span>
        </div>
      )}

      {state.phase === 'not_found' && (
        <div className={styles.resultCard}>
          <p className={styles.notFound}>No book found for ISBN {state.isbn}</p>
          <button className="btn btn-secondary" onClick={handleScanAgain}>Scan again</button>
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
              {state.phase === 'adding' ? 'Adding…' : 'Add to library'}
            </button>
            <button className="btn btn-secondary" onClick={handleScanAgain}>
              Scan again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
