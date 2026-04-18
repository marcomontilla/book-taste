import { useNavigate } from 'react-router-dom'
import { BookCover } from '@/components/books/BookCover'
import type { BookSearchResult } from '@/types'
import styles from './SearchResultCard.module.css'

interface Props {
  result: BookSearchResult
}

export function SearchResultCard({ result }: Props) {
  const navigate = useNavigate()
  const authors = result.authors.slice(0, 2).join(', ')

  return (
    <button className={styles.card} onClick={() => navigate('/books/preview', { state: { book: result } })}>
      <BookCover url={result.coverUrl} title={result.title} size="md" />
      <div className={styles.info}>
        <p className={styles.title}>{result.title}</p>
        {result.subtitle && <p className={styles.subtitle}>{result.subtitle}</p>}
        {authors && <p className={styles.author}>{authors}</p>}
        <div className={styles.meta}>
          {result.publishYear && <span className={styles.year}>{result.publishYear}</span>}
          {result.seriesName && <span className={styles.series}>{result.seriesName}</span>}
        </div>
      </div>
    </button>
  )
}
