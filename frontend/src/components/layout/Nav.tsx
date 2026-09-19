import { NavLink } from 'react-router-dom'
import { IconCard, IconChart, IconGrid, IconUser } from '../Icons'

const items: Array<{
  to: string
  label: string
  icon: typeof IconGrid
  end?: boolean
}> = [
  { to: '/', label: 'Обзор', icon: IconGrid, end: true },
  { to: '/analytics', label: 'Аналитика', icon: IconChart },
  { to: '/accounts', label: 'Счета', icon: IconCard },
  { to: '/profile', label: 'Профиль', icon: IconUser },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-brand">
        <div className="auth-logo">FT</div>
        <strong>Finance Tracker</strong>
      </div>
      <nav className="sidebar-nav" aria-label="Боковая навигация">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon width={20} height={20} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/transactions"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          Операции
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          Категории
        </NavLink>
      </nav>
    </aside>
  )
}
