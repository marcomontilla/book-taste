import styles from './Page.module.css'

export function WantToReadPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Want to Read</h1>
      </div>

      <div className="empty-state">
        <span className="empty-state-icon">🔖</span>
        <p className="empty-state-title">Nothing here yet</p>
        <p className="empty-state-body">
          Books you want to read will appear here.
        </p>
      </div>
    </div>
  )
}
