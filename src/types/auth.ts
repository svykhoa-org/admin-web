import type { User } from '@/models/User'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  isTwoFactorRequired: boolean
  accessToken: string
  refreshToken: string
  user: User
}
