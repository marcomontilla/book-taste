import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import i18n from '@/i18n/index'
import { useInsights } from '@/hooks/useInsights'
import type { UserBookWithBook, RecommendationItem } from '@/types'
import styles from './IntelligencePanel.module.css'

interface Props {
  userBook: UserBookWithBook
  completedBooks: { title: string; authors: string[] }[]
}

export function IntelligencePanel({ userBook, completedBooks }: Props) {
  const { book } = userBook
  const { t } = useTranslation()
  const { insight, recommendations, loading, generating, error, generate, hasInsights } =
    useInsights(userBook.book_id)

  const similar = recommendations.find(r => r.recommendation_type === 'similar')
  const blindSide = recommendations.find(r => r.recommendation_type === 'blind_side')

  const similarItems = (similar?.payload_json as RecommendationItem[] | undefined) ?? []
  const blindSideItems = (blindSide?.payload_json as RecommendationItem[] | undefined) ?? []

  function handleGenerate() {
    generate({
      book: {
        title: book.title,
        subtitle: book.subtitle,
        authors: book.authors,
        description: book.description,
        series_name: book.series_name,
        page_count: book.page_count,
      },
      completedBooks,
      source: 'on_demand',
      language: i18n.language,
    })
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.heading}>{t('intelligence.title')}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{t('intelligence.title')}</h2>
        {hasInsights && (
          <button className={styles.refreshBtn} onClick={handleGenerate} disabled={generating}>
            {generating ? t('common.saving') : t('intelligence.refresh')}
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {generating && (
        <div className={styles.generatingBanner}>
          <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
          <span>{t('intelligence.generating')}</span>
        </div>
      )}

      {!hasInsights && !generating ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{t('intelligence.emptyText')}</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleGenerate} disabled={generating}>
            {t('intelligence.generate')}
          </button>
        </div>
      ) : hasInsights && insight ? (
        <div className={styles.content}>
          <div className={styles.reasonCard}>
            <p className={styles.reasonLabel}>{t('intelligence.likeLabel')}</p>
            <p className={styles.reasonText}>{insight.like_reason}</p>
          </div>

          <div className={[styles.reasonCard, styles.reasonCardCaution].join(' ')}>
            <p className={styles.reasonLabel}>{t('intelligence.dislikeLabel')}</p>
            <p className={styles.reasonText}>{insight.dislike_reason}</p>
          </div>

          {similarItems.length > 0 && (
            <div className={styles.recSection}>
              <p className={styles.recSectionTitle}>{t('intelligence.similar')}</p>
              <ul className={styles.recList}>
                {similarItems.map((item, i) => (
                  <RecItem key={i} item={item} />
                ))}
              </ul>
            </div>
          )}

          {blindSideItems.length > 0 && (
            <div className={styles.recSection}>
              <p className={styles.recSectionTitle}>{t('intelligence.different')}</p>
              <ul className={styles.recList}>
                <RecItem item={blindSideItems[0]} />
              </ul>
            </div>
          )}

          <p className={styles.generatedAt}>
            {t('intelligence.generatedAt', { date: new Date(insight.updated_at).toLocaleDateString() })}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function RecItem({ item }: { item: RecommendationItem }) {
  const navigate = useNavigate()
  const q = encodeURIComponent(`${item.title} ${item.author}`)
  return (
    <li
      className={styles.recItem}
      onClick={() => navigate(`/search?q=${q}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') navigate(`/search?q=${q}`) }}
    >
      <div className={styles.recMeta}>
        <span className={styles.recTitle}>{item.title}</span>
        <span className={styles.recAuthor}>{item.author}</span>
      </div>
      <p className={styles.recReason}>{item.reason}</p>
    </li>
  )
}
