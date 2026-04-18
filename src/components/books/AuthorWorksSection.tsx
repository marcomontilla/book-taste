import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BookCover } from './BookCover'
import { fetchAuthorWorks } from '@/services/books'
import type { BookSearchResult } from '@/types'
import styles from './AuthorWorksSection.module.css'

interface Props {
  authorName: string
  excludeTitle: string
}

export function AuthorWorksSection({ authorName, excludeTitle }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [works, setWorks] = useState<BookSearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAuthorWorks(authorName, excludeTitle)
      .then(setWorks)
      .catch(() => setWorks([]))
      .finally(() => setLoading(false))
  }, [authorName, excludeTitle])

  if (loading) {
    return (
      <div className={styles.section}>
        <h2 className={styles.heading}>{t('book.moreByAuthor', { author: authorName })}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <div className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: '2px' }} />
        </div>
      </div>
    )
  }

  if (works.length === 0) return null

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>{t('book.moreByAuthor', { author: authorName })}</h2>
      <div className={styles.scrollRow}>
        {works.map(w => {
          const q = encodeURIComponent(`${w.title} ${w.authors[0] ?? authorName}`)
          return (
            <button
              key={w.olKey || w.title}
              className={styles.workCard}
              onClick={() => navigate(`/search?q=${q}`)}
              title={w.title}
            >
              <BookCover url={w.coverUrl} title={w.title} size="sm" />
              <p className={styles.workTitle}>{w.title}</p>
              {w.publishYear && <p className={styles.workYear}>{w.publishYear}</p>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
