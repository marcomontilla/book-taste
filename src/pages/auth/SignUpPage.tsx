import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AuthPage.module.css'

export function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError(t('auth.passwordError'))
      return
    }
    setError(null)
    setLoading(true)
    try {
      await signUpWithEmail(email, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signup.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signup.googleError'))
    }
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t('auth.signup.confirmTitle')}</h1>
          <p className={styles.subtitle}>
            {t('auth.signup.confirmBody', { email })}
          </p>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>
            {t('auth.signup.backToLogin')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('auth.signup.title')}</h1>
        <p className={styles.subtitle}>{t('auth.signup.subtitle')}</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.passwordNewPlaceholder')}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </button>
        </form>

        <div className={styles.divider}><span>{t('common.or')}</span></div>

        <button type="button" className="btn btn-outline" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {t('auth.signup.google')}
        </button>

        <p className={styles.footer}>
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login">{t('auth.signup.signIn')}</Link>
        </p>
      </div>
    </div>
  )
}
