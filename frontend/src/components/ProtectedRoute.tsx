import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FinanceProvider } from '../context/FinanceContext'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <FinanceProvider>
      <Outlet />
    </FinanceProvider>
  )
}
