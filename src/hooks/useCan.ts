import { hasPermission, type Permission } from '@/models/Permission'
import { useAuthStore } from '@/store/authStore'

export const useCan = (permission: Permission) => {
  const user = useAuthStore(s => s.user)
  return hasPermission(user, permission)
}
