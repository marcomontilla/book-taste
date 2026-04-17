import { useParams } from 'react-router-dom'
import styles from './Page.module.css'

export function BookDetailPage() {
  const { id } = useParams()

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Book Details</h1>
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Book ID: {id} — Detail view coming in phase 2.
      </p>
    </div>
  )
}
