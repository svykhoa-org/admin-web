import { create } from 'zustand'
import type { SiteSettings, UpdateSiteSettingsInput } from '@/models/SiteSettings'
import { getSiteSettings, updateSiteSettings } from '@/services/SiteSettings'

interface SiteSettingsState {
  settings: SiteSettings | null
  isLoading: boolean
  isSaving: boolean
}

interface SiteSettingsActions {
  fetchSettings: () => Promise<void>
  saveSettings: (input: UpdateSiteSettingsInput) => Promise<void>
}

export const useSiteSettingsStore = create<SiteSettingsState & SiteSettingsActions>((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const data = await getSiteSettings()
      set({ settings: data })
    } finally {
      set({ isLoading: false })
    }
  },

  saveSettings: async (input) => {
    set({ isSaving: true })
    try {
      const data = await updateSiteSettings(input)
      set({ settings: data })
    } catch (error) {
      set({ isSaving: false })
      throw error
    }
    set({ isSaving: false })
  },
}))
