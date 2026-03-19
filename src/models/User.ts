export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatar: string | null
}
