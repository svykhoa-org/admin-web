import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import ENV from '@/constants/env'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const axiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ENV.API_KEY,
  },
})

// Auth endpoints return 401/403 for genuine credential / refresh-token failures, not an expired
// access token — never run the refresh-and-retry flow for them (else a wrong-password login 401
// would fire a spurious POST /auth/refresh with a null token → 400 refreshToken should not be empty).
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout']

let isRefreshing = false
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  refreshQueue = []
}

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Content-Type', undefined)
    } else if (config.headers) {
      delete (config.headers as Record<string, string>)['Content-Type']
    }
  }

  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  res => res,
  async (error: unknown) => {
    const err = error as AxiosError & {
      config: InternalAxiosRequestConfig & { _retry?: boolean }
    }
    const original = err.config

    const isAuthEndpoint = AUTH_ENDPOINTS.some(path => original?.url?.includes(path))
    if (err.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    original._retry = true

    // No refresh token → not authenticated; don't POST a null token (server rejects it 400).
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return axiosInstance(original)
      })
    }

    isRefreshing = true

    try {
      const { data } = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
        `${ENV.API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json', 'x-api-key': ENV.API_KEY } },
      )
      const newAccess = data.data.accessToken
      const newRefresh = data.data.refreshToken
      setTokens(newAccess, newRefresh)
      processQueue(null, newAccess)
      original.headers.Authorization = `Bearer ${newAccess}`
      return axiosInstance(original)
    } catch (refreshError) {
      // Refresh failed (invalid/rotated refresh token → 403) — flush queued requests so they
      // reject instead of hanging forever, then bounce to login.
      processQueue(refreshError, null)
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
