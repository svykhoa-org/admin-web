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

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

const processQueue = (token: string) => {
  refreshQueue.forEach(cb => cb(token))
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

    if (err.response?.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>(resolve => {
        refreshQueue.push(resolve)
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return axiosInstance(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      const { data } = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
        `${ENV.API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json', 'x-api-key': ENV.API_KEY } },
      )
      const newAccess = data.data.accessToken
      const newRefresh = data.data.refreshToken
      setTokens(newAccess, newRefresh)
      processQueue(newAccess)
      original.headers.Authorization = `Bearer ${newAccess}`
      return axiosInstance(original)
    } catch {
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
