import { Outlet } from 'react-router-dom'
import { BottomNav, DesktopSidebar } from './Nav'

export function AppLayout() {
  return (
    <div className="app-shell">
      <DesktopSidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
