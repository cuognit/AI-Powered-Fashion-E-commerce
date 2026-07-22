import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

export default function AdminRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}
