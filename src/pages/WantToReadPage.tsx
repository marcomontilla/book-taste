import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookCover } from '@/components/books/BookCover'
import { useWantToRead } from '@/hooks/useWantToRead'
import styles from './WantToReadPage.module.css'
import pageStyles from './Page.module.css'

export function WantToReadPage() {
  const { items, loading, error } = useWantToRead()
  const { t } = useTranslation()
  const navigate = useNavigate()

  function handleItemClick(item: typeof items[number]) {
    navigate('/books/preview', {
      state: {
        book: {
          title: item.book.title,
          subtitle: null,
          authors: item.book.authors,
          coverUrl: item.book.cover_url,
          olKey: item.book.open_library_key,
          isbn13: item.book.isbn_13,
          isbn10: item.book.isbn_10,
          publishYear: null,
          pageCount: item.book.page_count,
          seriesName: item.book.series_name,
        },
        bookId: item.bookId,
        wtrCollectionBookId: item.collectionBookId,
      },
    })
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>
        <h1 className={pageStyles.pageTitle}>{t('wtr.title')}</h1>
        <button
          className="btn btn-outline"
          style={{ width: 'auto' }}
          onClick={() => navigate('/search')}
        >
          {t('wtr.add')}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔖</span>
          <p className="empty-state-title">{t('wtr.empty.title')}</p>
          <p className="empty-state-body">{t('wtr.empty.body')}</p>
        </div>
      ) : (
        <ul className={pageStyles.bookList}>
          {items.map(item => (
            <li key={item.collectionBookId}>
              <button
                className={styles.item}
                onClick={() => handleItemClick(item)}
              >
                <BookCover url={item.book.cover_url} title={item.book.title} size="md" />
                <div className={styles.info}>
                  <p className={styles.title}>{item.book.title}</p>
                  {item.book.authors.length > 0 && (
                    <p className={styles.author}>{item.book.authors.slice(0, 2).join(', ')}</p>
                  )}
                  {item.book.series_name && (
                    <p className={styles.series}>{item.book.series_name}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
