import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext'
import styles from './SettingsPage.module.css'
import pageStyles from './Page.module.css'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { mode, setMode } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleLanguage(code: string) {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
  }

  const themes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('settings.theme.light') },
    { value: 'dark',  label: t('settings.theme.dark') },
    { value: 'system', label: t('settings.theme.system') },
  ]

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>
        <h1 className={pageStyles.pageTitle}>{t('settings.title')}</h1>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>{t('settings.signedInAs')}</p>
        <p className={styles.sectionValue}>{user?.email}</p>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>{t('settings.theme.label')}</p>
        <div className={styles.segmented}>
          {themes.map(th => (
            <button
              key={th.value}
              className={[styles.segment, mode === th.value ? styles.segmentActive : ''].join(' ')}
              onClick={() => setMode(th.value)}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>{t('settings.language.label')}</p>
        <div className={styles.segmented}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={[styles.segment, i18n.language === lang.code ? styles.segmentActive : ''].join(' ')}
              onClick={() => handleLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button
          className="btn btn-outline"
          onClick={handleSignOut}
          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
        >
          {t('settings.signOut')}
        </button>
      </div>
    </div>
  )
}
