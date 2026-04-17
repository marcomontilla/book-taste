import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import styles from './AppShell.module.css'

const navItems = [
  { to: '/library',     label: 'Library',       icon: '📚' },
  { to: '/want-to-read', label: 'Want to Read', icon: '🔖' },
  { to: '/collections', label: 'Collections',   icon: '🗂' },
  { to: '/settings',   label: 'Settings',       icon: '⚙️' },
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
      {/* Top bar — visible on all sizes */}
      <header className={styles.topbar}>
        <span className={styles.brand}>BookTaste</span>
        <button className={styles.avatarBtn} onClick={handleSignOut} title="Sign out">
          {user?.email?.[0].toUpperCase() ?? '?'}
        </button>
      </header>

      <div className={styles.body}>
        {/* Sidebar nav — desktop only */}
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
        </nav>

        {/* Main content area */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile only */}
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
