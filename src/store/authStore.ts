import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isStaffRole, type User } from '@/models/User'
import axiosInstance, { setTokens, clearTokens, getAccessToken, getRefreshToken } from '@/lib/axios'
import { logout as apiLogout } from '@/services/Auth/logout'
import { refresh as apiRefresh } from '@/services/Auth/refresh'
import { getProfile } from '@/services/Auth/profile'
import type { ApiDetailResponse } from '@/types/api'
import { ApiResponseError, unwrapDetail } from '@/utils/apiResponse'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (payload: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async payload => {
        set({ isLoading: true })
        try {
          const res = await axiosInstance.post<
            ApiDetailResponse<{ user: User; accessToken: string; refreshToken: string }>
          >('/auth/login', payload)
          const { user: loginUser, accessToken, refreshToken } = unwrapDetail(res.data)
          setTokens(accessToken, refreshToken)
          // Only staff may use the admin panel. UI gate only — the server
          // rejects every admin endpoint for other roles anyway.
          if (!isStaffRole(loginUser.role)) {
            await apiLogout().catch(() => undefined)
            clearTokens()
            throw new ApiResponseError(403, 'Tài khoản không có quyền truy cập trang quản trị')
          }
          const user = await getProfile()
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await apiLogout()
        } finally {
          clearTokens()
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      refresh: async () => {
        const currentRefreshToken = get().refreshToken ?? getRefreshToken()
        if (!currentRefreshToken) return

        const { accessToken, refreshToken } = await apiRefresh({
          refreshToken: currentRefreshToken,
        })
        setTokens(accessToken, refreshToken)
        set({ accessToken, refreshToken })
      },

      // Re-read role/permissions so changes by a super admin show up on reload.
      refreshProfile: async () => {
        if (!get().isAuthenticated) return
        const user = await getProfile()
        set({ user })
      },

      clearAuth: () => {
        clearTokens()
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({ user: state.user }),
      onRehydrateStorage: () => state => {
        if (state) {
          state.isAuthenticated = !!state.user
          state.accessToken = getAccessToken()
          state.refreshToken = getRefreshToken()
        }
      },
    },
  ),
)
