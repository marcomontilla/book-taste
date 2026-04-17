import { useState } from 'react'
import { BookCover } from '@/components/books/BookCover'
import { upsertBook } from '@/services/books'
import { addToLibrary } from '@/services/userBooks'
import { addToWantToRead } from '@/services/collections'
import { useToast } from '@/contexts/ToastContext'
import type { BookSearchResult } from '@/types'
import styles from './SearchResultCard.module.css'

interface Props {
  result: BookSearchResult
}

type BtnState = 'idle' | 'loading' | 'done'

export function SearchResultCard({ result }: Props) {
  const { showToast } = useToast()
  const [libraryState, setLibraryState] = useState<BtnState>('idle')
  const [wtrState, setWtrState]         = useState<BtnState>('idle')

  const authors = result.authors.slice(0, 2).join(', ')

  async function handleAddLibrary() {
    if (libraryState !== 'idle') return
    setLibraryState('loading')
    try {
      const book = await upsertBook(result)
      await addToLibrary(book.id)
      setLibraryState('done')
      showToast('Added to library')
    } catch (e) {
      setLibraryState('idle')
      showToast(e instanceof Error ? e.message : 'Could not add book', 'error')
    }
  }

  async function handleAddWTR() {
    if (wtrState !== 'idle') return
    setWtrState('loading')
    try {
      const book = await upsertBook(result)
      await addToWantToRead(book.id)
      setWtrState('done')
      showToast('Saved to Want to Read')
    } catch (e) {
      setWtrState('idle')
      showToast(e instanceof Error ? e.message : 'Could not save book', 'error')
    }
  }

  return (
    <div className={styles.card}>
      <BookCover url={result.coverUrl} title={result.title} size="md" />

      <div className={styles.info}>
        <p className={styles.title}>{result.title}</p>
        {result.subtitle && (
          <p className={styles.subtitle}>{result.subtitle}</p>
        )}
        {authors && <p className={styles.author}>{authors}</p>}
        <div className={styles.meta}>
          {result.publishYear && (
            <span className={styles.year}>{result.publishYear}</span>
          )}
          {result.seriesName && (
            <span className={styles.series}>{result.seriesName}</span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={[
              styles.actionBtn,
              libraryState === 'done' ? styles.done : '',
            ].join(' ')}
            onClick={handleAddLibrary}
            disabled={libraryState !== 'idle'}
          >
            {libraryState === 'done' ? '✓ In Library' :
             libraryState === 'loading' ? '…' : '+ Library'}
          </button>

          <button
            className={[
              styles.actionBtn,
              styles.actionBtnSecondary,
              wtrState === 'done' ? styles.done : '',
            ].join(' ')}
            onClick={handleAddWTR}
            disabled={wtrState !== 'idle'}
          >
            {wtrState === 'done' ? '✓ Saved' :
             wtrState === 'loading' ? '…' : '+ Want to Read'}
          </button>
        </div>
      </div>
    </div>
  )
}
