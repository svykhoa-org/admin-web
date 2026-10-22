import { Navigate, Outlet } from 'react-router-dom'
import { isStaffRole } from '@/models/User'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const role = useAuthStore(s => s.user?.role)
  // A persisted session from before the staff-only login gate is not valid here.
  if (!isAuthenticated || !isStaffRole(role)) return <Navigate to="/login" replace />
  return <Outlet />
}
