import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen, Bookmark, FolderOpen, Settings2,
  Search, ScanLine, User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AppShell.module.css'

export function AppShell() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/library',      label: t('nav.library'),     Icon: BookOpen   },
    { to: '/want-to-read', label: t('nav.wantToRead'),  Icon: Bookmark   },
    { to: '/collections',  label: t('nav.collections'), Icon: FolderOpen },
    { to: '/settings',     label: t('nav.settings'),    Icon: Settings2  },
  ]

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
            <ScanLine size={20} strokeWidth={1.75} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/search')}
            title={t('nav.search')}
            aria-label={t('nav.search')}
          >
            <Search size={20} strokeWidth={1.75} />
          </button>
          <button
            className={styles.avatarBtn}
            onClick={() => navigate('/settings')}
            title={t('nav.settings')}
            aria-label={t('nav.settings')}
          >
            {user?.email?.[0].toUpperCase() ?? <User size={14} />}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar}>
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
              }
            >
              <Icon size={18} strokeWidth={1.75} className={styles.navIcon} />
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/search"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
            }
          >
            <Search size={18} strokeWidth={1.75} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('nav.search')}</span>
          </NavLink>
          <NavLink
            to="/scan"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
            }
          >
            <ScanLine size={18} strokeWidth={1.75} className={styles.navIcon} />
            <span className={styles.navLabel}>{t('nav.scan')}</span>
          </NavLink>
        </nav>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      <nav className={styles.bottomNav}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [styles.bottomNavItem, isActive ? styles.bottomNavItemActive : ''].join(' ')
            }
          >
            <Icon size={22} strokeWidth={1.75} className={styles.bottomNavIcon} />
            <span className={styles.bottomNavLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
