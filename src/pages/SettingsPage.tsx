import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import styles from './Page.module.css'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
      </div>

      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Signed in as
          </p>
          <p style={{ fontWeight: 500 }}>{user?.email}</p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

        <button
          className="btn btn-outline"
          onClick={handleSignOut}
          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
