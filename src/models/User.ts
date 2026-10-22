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
  headline?: string | null
  bio?: string | null
  // Present on GET /auth/profile for admins only (module permissions).
  permissions?: string[]
}

export const USER_VERIFICATION_STATUS: Record<
  UserVerificationStatus,
  { label: string; color: string }
> = {
  [UserVerificationStatus.None]: { label: 'Chưa nộp', color: 'default' },
  [UserVerificationStatus.Pending]: { label: 'Chờ duyệt', color: 'processing' },
  [UserVerificationStatus.Verified]: { label: 'Đã xác minh', color: 'success' },
  [UserVerificationStatus.Rejected]: { label: 'Từ chối', color: 'error' },
  [UserVerificationStatus.Expired]: { label: 'Hết hạn', color: 'warning' },
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
