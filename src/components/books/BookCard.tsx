import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { BookCover } from './BookCover'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StarRating } from '@/components/ui/StarRating'
import type { UserBookWithBook } from '@/types'
import styles from './BookCard.module.css'

interface Props {
  userBook: UserBookWithBook
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void
}

export function BookCard({ userBook, onFavoriteToggle }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { book, status, current_page, total_pages, rating, is_favorite } = userBook
  const authors = book.authors.slice(0, 2).join(', ')
  const effectiveTotal = total_pages ?? book.page_count

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    onFavoriteToggle?.(userBook.id, !is_favorite)
  }

  return (
    <button
      className={styles.card}
      onClick={() => navigate(`/books/${userBook.id}`)}
      aria-label={`${book.title} by ${authors}`}
    >
      <BookCover url={book.cover_url} title={book.title} size="md" />

      <div className={styles.info}>
        <div className={styles.titleRow}>
          <p className={styles.title}>{book.title}</p>
          {onFavoriteToggle && (
            <button
              className={[styles.heartBtn, is_favorite ? styles.heartActive : ''].join(' ')}
              onClick={handleFavorite}
              aria-label={is_favorite ? t('book.removeFromFavorites') : t('book.addToFavorites')}
            >
              <Heart size={15} strokeWidth={2} fill={is_favorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
        {authors && <p className={styles.author}>{authors}</p>}
        {book.series_name && (
          <p className={styles.series}>
            {book.series_name}
            {book.series_number != null ? ` #${book.series_number}` : ''}
          </p>
        )}

        <div className={styles.footer}>
          {status === 'completed' ? (
            <div className={styles.completedRow}>
              <span className={styles.badge}>{t('book.completed')}</span>
              {rating != null && <StarRating value={rating} readonly size="sm" />}
            </div>
          ) : (
            effectiveTotal ? (
              <div className={styles.progress}>
                <ProgressBar current={current_page} total={effectiveTotal} />
                <span className={styles.progressLabel}>
                  {current_page} / {effectiveTotal} {t('book.pages')}
                </span>
              </div>
            ) : (
              <span className={styles.badgeReading}>{t('book.reading')}</span>
            )
          )}
        </div>
      </div>
    </button>
  )
}
