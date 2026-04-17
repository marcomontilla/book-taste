import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AppShell.module.css'

const navItems = [
  { to: '/library',      label: 'Library',       icon: '📚' },
  { to: '/want-to-read', label: 'Want to Read',  icon: '🔖' },
  { to: '/collections',  label: 'Collections',   icon: '🗂'  },
  { to: '/settings',     label: 'Settings',      icon: '⚙️' },
]

export function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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
            className={styles.searchBtn}
            onClick={() => navigate('/scan')}
            title="Scan barcode"
            aria-label="Scan barcode"
          >
            📷
          </button>
          <button
            className={styles.searchBtn}
            onClick={() => navigate('/search')}
            title="Search books"
            aria-label="Search books"
          >
            🔍
          </button>
          <button className={styles.avatarBtn} onClick={handleSignOut} title="Sign out">
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
            <span className={styles.navLabel}>Search</span>
          </NavLink>
          <NavLink
            to="/scan"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>📷</span>
            <span className={styles.navLabel}>Scan</span>
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
