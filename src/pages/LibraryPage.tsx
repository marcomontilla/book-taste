import styles from './Page.module.css'

export function LibraryPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Library</h1>
      </div>

      <div className="empty-state">
        <span className="empty-state-icon">📚</span>
        <p className="empty-state-title">Your library is empty</p>
        <p className="empty-state-body">
          Add your first book to start tracking your reading.
        </p>
        <button className="btn btn-primary" style={{ width: 'auto', marginTop: '0.5rem' }}>
          + Add Book
        </button>
      </div>
    </div>
  )
}
