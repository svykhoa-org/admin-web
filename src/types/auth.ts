export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  isTwoFactorRequired: boolean
  accessToken: string
  refreshToken: string
  user: import('@/models/User').User
}
