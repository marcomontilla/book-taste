import { useInsights } from '@/hooks/useInsights'
import type { UserBookWithBook, RecommendationItem } from '@/types'
import styles from './IntelligencePanel.module.css'

interface Props {
  userBook: UserBookWithBook
  completedBooks: { title: string; authors: string[] }[]
}

export function IntelligencePanel({ userBook, completedBooks }: Props) {
  const { book } = userBook
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
    })
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.heading}>Book Intelligence</h2>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Book Intelligence</h2>
        {hasInsights && (
          <button
            className={styles.refreshBtn}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating…' : 'Refresh'}
          </button>
        )}
      </div>

      {error && (
        <p className={styles.error}>{error}</p>
      )}

      {generating && (
        <div className={styles.generatingBanner}>
          <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
          <span>Analysing your reading history…</span>
        </div>
      )}

      {!hasInsights && !generating ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            Get personalised insights — why you might love or skip this book, plus curated picks.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto' }}
            onClick={handleGenerate}
            disabled={generating}
          >
            Generate insights
          </button>
        </div>
      ) : hasInsights && insight ? (
        <div className={styles.content}>
          {/* Why you may like it */}
          <div className={styles.reasonCard}>
            <p className={styles.reasonLabel}>✦ Why you may like it</p>
            <p className={styles.reasonText}>{insight.like_reason}</p>
          </div>

          {/* Why you may not like it */}
          <div className={[styles.reasonCard, styles.reasonCardCaution].join(' ')}>
            <p className={styles.reasonLabel}>◈ Watch out for</p>
            <p className={styles.reasonText}>{insight.dislike_reason}</p>
          </div>

          {/* Similar reads */}
          {similarItems.length > 0 && (
            <div className={styles.recSection}>
              <p className={styles.recSectionTitle}>Similar reads</p>
              <ul className={styles.recList}>
                {similarItems.map((item, i) => (
                  <RecItem key={i} item={item} />
                ))}
              </ul>
            </div>
          )}

          {/* Blind side */}
          {blindSideItems.length > 0 && (
            <div className={styles.recSection}>
              <p className={styles.recSectionTitle}>Something different</p>
              <ul className={styles.recList}>
                <RecItem item={blindSideItems[0]} />
              </ul>
            </div>
          )}

          <p className={styles.generatedAt}>
            Generated {new Date(insight.updated_at).toLocaleDateString()}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function RecItem({ item }: { item: RecommendationItem }) {
  return (
    <li className={styles.recItem}>
      <div className={styles.recMeta}>
        <span className={styles.recTitle}>{item.title}</span>
        <span className={styles.recAuthor}>{item.author}</span>
      </div>
      <p className={styles.recReason}>{item.reason}</p>
    </li>
  )
}
