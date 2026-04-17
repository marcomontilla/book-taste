import styles from './Page.module.css'

export function CollectionsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Collections</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }}>
          + New
        </button>
      </div>

      <div className="empty-state">
        <span className="empty-state-icon">🗂</span>
        <p className="empty-state-title">No collections yet</p>
        <p className="empty-state-body">
          Group your books into custom collections.
        </p>
      </div>
    </div>
  )
}
