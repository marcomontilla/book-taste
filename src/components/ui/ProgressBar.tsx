import styles from './ProgressBar.module.css'

interface Props {
  current: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ current, total, showLabel = false }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className={styles.label}>{pct}%</span>
      )}
    </div>
  )
}
