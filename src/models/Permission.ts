import { UserRole, type User } from './User'

// Mirrors the server `Permission` enum (one permission per admin module).
export enum Permission {
  All = '*',
  Users = 'users',
  Verification = 'verification',
  Forum = 'forum',
  Articles = 'articles',
  Bulletins = 'bulletins',
  Courses = 'courses',
  Documents = 'documents',
  Orders = 'orders',
  Analytics = 'analytics',
  SiteSettings = 'site_settings',
}

export const MODULE_PERMISSIONS: { value: Permission; label: string }[] = [
  { value: Permission.Analytics, label: 'Dashboard & thống kê' },
  { value: Permission.Users, label: 'Người dùng' },
  { value: Permission.Verification, label: 'Xác minh bác sĩ' },
  { value: Permission.Courses, label: 'Khoá học & video' },
  { value: Permission.Articles, label: 'Bài viết' },
  { value: Permission.Bulletins, label: 'Văn bản pháp luật' },
  { value: Permission.Documents, label: 'Tài liệu' },
  { value: Permission.Orders, label: 'Đơn hàng' },
  { value: Permission.Forum, label: 'Diễn đàn' },
  { value: Permission.SiteSettings, label: 'Cài đặt hệ thống' },
]

// Same rule as the server: super admin bypasses; admin needs the module or `*`.
// UI hint only — the server enforces every permission.
export const hasPermission = (
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  permission: Permission,
) => {
  if (!user) return false
  if (user.role === UserRole.SuperAdmin) return true
  if (user.role !== UserRole.Admin) return false
  const granted = user.permissions ?? []
  return granted.includes(Permission.All) || granted.includes(permission)
}
