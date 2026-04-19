import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, CheckCircle, Heart, BookMarked } from 'lucide-react'
import { BookCover } from '@/components/books/BookCover'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StarRating } from '@/components/ui/StarRating'
import { useLibrary } from '@/hooks/useLibrary'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { userBooks, loading } = useLibrary()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const reading = userBooks.filter(ub => ub.status === 'reading')
  const completed = userBooks.filter(ub => ub.status === 'completed')
  const favorites = userBooks.filter(ub => ub.is_favorite)
  const totalPages = userBooks.reduce(
    (sum, ub) => sum + (ub.status === 'completed' ? (ub.total_pages ?? ub.book.page_count ?? 0) : ub.current_page),
    0,
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{t('dashboard.title')}</h1>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <BookOpen size={20} strokeWidth={1.75} className={styles.statIcon} />
          <span className={styles.statValue}>{reading.length}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.reading')}</span>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={20} strokeWidth={1.75} className={styles.statIcon} />
          <span className={styles.statValue}>{completed.length}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.completed')}</span>
        </div>
        <div className={styles.statCard}>
          <Heart size={20} strokeWidth={1.75} className={styles.statIcon} />
          <span className={styles.statValue}>{favorites.length}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.favorites')}</span>
        </div>
        <div className={styles.statCard}>
          <BookMarked size={20} strokeWidth={1.75} className={styles.statIcon} />
          <span className={styles.statValue}>{totalPages.toLocaleString()}</span>
          <span className={styles.statLabel}>{t('dashboard.stats.pages')}</span>
        </div>
      </div>

      {/* Currently reading */}
      {reading.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('dashboard.currentlyReading')}</h2>
          <ul className={styles.bookList}>
            {reading.slice(0, 4).map(ub => {
              const total = ub.total_pages ?? ub.book.page_count
              return (
                <li key={ub.id}>
                  <button className={styles.bookRow} onClick={() => navigate(`/books/${ub.id}`)}>
                    <BookCover url={ub.book.cover_url} title={ub.book.title} size="sm" />
                    <div className={styles.bookInfo}>
                      <p className={styles.bookTitle}>{ub.book.title}</p>
                      <p className={styles.bookAuthor}>{ub.book.authors.slice(0, 2).join(', ')}</p>
                      {total ? (
                        <div className={styles.progressWrap}>
                          <ProgressBar current={ub.current_page} total={total} />
                          <span className={styles.progressLabel}>
                            {ub.current_page} / {total}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.progressLabel}>
                          {t('dashboard.page', { page: ub.current_page })}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('dashboard.favorites')}</h2>
          <ul className={styles.bookList}>
            {favorites.slice(0, 6).map(ub => (
              <li key={ub.id}>
                <button className={styles.bookRow} onClick={() => navigate(`/books/${ub.id}`)}>
                  <BookCover url={ub.book.cover_url} title={ub.book.title} size="sm" />
                  <div className={styles.bookInfo}>
                    <p className={styles.bookTitle}>{ub.book.title}</p>
                    <p className={styles.bookAuthor}>{ub.book.authors.slice(0, 2).join(', ')}</p>
                    {ub.rating != null && <StarRating value={ub.rating} readonly size="sm" />}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent completions */}
      {completed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('dashboard.recentlyCompleted')}</h2>
          <ul className={styles.bookList}>
            {completed.slice(0, 4).map(ub => (
              <li key={ub.id}>
                <button className={styles.bookRow} onClick={() => navigate(`/books/${ub.id}`)}>
                  <BookCover url={ub.book.cover_url} title={ub.book.title} size="sm" />
                  <div className={styles.bookInfo}>
                    <p className={styles.bookTitle}>{ub.book.title}</p>
                    <p className={styles.bookAuthor}>{ub.book.authors.slice(0, 2).join(', ')}</p>
                    {ub.rating != null && <StarRating value={ub.rating} readonly size="sm" />}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {userBooks.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📊</span>
          <p className="empty-state-title">{t('dashboard.empty.title')}</p>
          <p className="empty-state-body">{t('dashboard.empty.body')}</p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', marginTop: '0.5rem' }}
            onClick={() => navigate('/search')}
          >
            {t('dashboard.empty.btn')}
          </button>
        </div>
      )}
    </div>
  )
}
