import type { AbstractModel } from './AbstractModel'

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export enum UserStatus {
  Active = 'active',
  Blocked = 'blocked',
}

export interface User extends AbstractModel {
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  avatar: string | null
  googleId: string | null
  facebookId: string | null
}
