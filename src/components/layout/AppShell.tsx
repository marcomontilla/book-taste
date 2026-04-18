import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AppShell.module.css'

export function AppShell() {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/library',      label: t('nav.library'),      icon: '📚' },
    { to: '/want-to-read', label: t('nav.wantToRead'),   icon: '🔖' },
    { to: '/collections',  label: t('nav.collections'),  icon: '🗂'  },
    { to: '/settings',     label: t('nav.settings'),     icon: '⚙️' },
  ]

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>BookTaste</span>
        <div className={styles.topbarRight}>
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/scan')}
            title={t('nav.scan')}
            aria-label={t('nav.scan')}
          >
            📷
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/search')}
            title={t('nav.search')}
            aria-label={t('nav.search')}
          >
            🔍
          </button>
          <button className={styles.avatarBtn} onClick={handleSignOut} title={t('settings.signOut')}>
            {user?.email?.[0].toUpperCase() ?? '?'}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/search"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>🔍</span>
            <span className={styles.navLabel}>{t('nav.search')}</span>
          </NavLink>
          <NavLink
            to="/scan"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>📷</span>
            <span className={styles.navLabel}>{t('nav.scan')}</span>
          </NavLink>
        </nav>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      <nav className={styles.bottomNav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.bottomNavItem, isActive ? styles.bottomNavItemActive : ''].join(' ')
            }
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
