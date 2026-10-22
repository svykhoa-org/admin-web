import type { AbstractModel } from './AbstractModel'

export enum UserRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Instructor = 'instructor',
  User = 'user',
}

export enum UserStatus {
  Active = 'active',
  Blocked = 'blocked',
}

export enum UserVerificationStatus {
  None = 'none',
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
  Expired = 'expired',
}

export interface User extends AbstractModel {
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  avatar: string | null
  googleId: string | null
  facebookId: string | null
  isTwoFactorEnabled?: boolean
  verificationStatus?: UserVerificationStatus
  // Present on GET /auth/profile for admins only (module permissions).
  permissions?: string[]
}

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: 'Super Admin',
  [UserRole.Admin]: 'Admin',
  [UserRole.Instructor]: 'Giảng viên',
  [UserRole.User]: 'Người dùng',
}

export const USER_ROLE_COLOR: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: 'magenta',
  [UserRole.Admin]: 'blue',
  [UserRole.Instructor]: 'green',
  [UserRole.User]: 'default',
}

export const isStaffRole = (role?: UserRole) =>
  role === UserRole.SuperAdmin || role === UserRole.Admin
