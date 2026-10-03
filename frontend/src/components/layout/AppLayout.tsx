import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { fetchLatestRelease, markLatestReleaseSeen } from '../../api/releases'
import { useAuth } from '../../context/AuthContext'
import type { Release } from '../../types'
import { WhatsNewModal } from '../WhatsNewModal'
import { BottomNav, DesktopSidebar } from './Nav'

const CURRENT_VERSION = (import.meta.env.VITE_APP_VERSION ?? 'dev').replace(/^v/, '')

export function AppLayout() {
  const { user, setLastSeenRelease } = useAuth()
  const [release, setRelease] = useState<Release | null>(null)

  useEffect(() => {
    if (!user || CURRENT_VERSION === 'dev' || user.last_seen_release === CURRENT_VERSION) {
      setRelease(null)
      return
    }

    let cancelled = false
    async function loadRelease() {
      try {
        const latest = await fetchLatestRelease()
        if (!cancelled && latest.version === CURRENT_VERSION) {
          setRelease(latest)
        }
      } catch {
        // Release notes must not prevent the application from loading.
      }
    }

    void loadRelease()
    return () => {
      cancelled = true
    }
  }, [user])

  async function acknowledgeRelease() {
    if (!release) return
    await markLatestReleaseSeen()
    setLastSeenRelease(release.version)
    setRelease(null)
  }

  return (
    <div className="app-shell">
      <DesktopSidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
      <WhatsNewModal release={release} onAcknowledge={acknowledgeRelease} />
    </div>
  )
}
