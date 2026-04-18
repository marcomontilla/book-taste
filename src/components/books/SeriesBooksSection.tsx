import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookCover } from './BookCover'
import { fetchSeriesBooks } from '@/services/books'
import type { SeriesBook } from '@/services/books'
import styles from './AuthorWorksSection.module.css'

interface Props {
  seriesKey: string
  seriesName: string
  currentOlKey: string
}

export function SeriesBooksSection({ seriesKey, seriesName, currentOlKey }: Props) {
  const navigate = useNavigate()
  const [books, setBooks] = useState<SeriesBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSeriesBooks(seriesKey, currentOlKey)
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [seriesKey, currentOlKey])

  if (loading) {
    return (
      <div className={styles.section}>
        <h2 className={styles.heading}>{seriesName} Series</h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <div className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }} />
        </div>
      </div>
    )
  }

  if (books.length === 0) return null

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>{seriesName} Series</h2>
      <div className={styles.scrollRow}>
        {books.map(b => (
          <button
            key={b.olKey}
            className={styles.workCard}
            onClick={() => navigate(`/search?q=${encodeURIComponent(b.title)}`)}
            title={b.title}
          >
            <BookCover url={b.coverUrl ?? null} title={b.title} size="sm" />
            <p className={styles.workTitle}>{b.title}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
