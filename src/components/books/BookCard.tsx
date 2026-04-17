import { useNavigate } from 'react-router-dom'
import { BookCover } from './BookCover'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { UserBookWithBook } from '@/types'
import styles from './BookCard.module.css'

interface Props {
  userBook: UserBookWithBook
}

export function BookCard({ userBook }: Props) {
  const navigate = useNavigate()
  const { book, status, current_page, total_pages } = userBook
  const authors = book.authors.slice(0, 2).join(', ')
  const effectiveTotal = total_pages ?? book.page_count

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/books/${userBook.id}`)}
      aria-label={`${book.title} by ${authors}`}
    >
      <BookCover url={book.cover_url} title={book.title} size="md" />

      <div className={styles.info}>
        <p className={styles.title}>{book.title}</p>
        {authors && <p className={styles.author}>{authors}</p>}
        {book.series_name && (
          <p className={styles.series}>
            {book.series_name}
            {book.series_number != null ? ` #${book.series_number}` : ''}
          </p>
        )}

        <div className={styles.footer}>
          {status === 'completed' ? (
            <span className={styles.badge}>✓ Completed</span>
          ) : (
            effectiveTotal ? (
              <div className={styles.progress}>
                <ProgressBar current={current_page} total={effectiveTotal} />
                <span className={styles.progressLabel}>
                  {current_page} / {effectiveTotal} pages
                </span>
              </div>
            ) : (
              <span className={styles.badgeReading}>Reading</span>
            )
          )}
        </div>
      </div>
    </button>
  )
}
