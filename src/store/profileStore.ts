import { create } from 'zustand'

export interface BusinessProfile {
  id: number
  name: string
  type: string
  logo_path: string | null
  address: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  currency_symbol: string
  currency_code: string
  active_modules: string[]
  custom_labels: Record<string, string>
  financial_year_start: string
  invoice_prefix: string
  invoice_counter: number
  receipt_footer: string | null
}

interface ProfileState {
  profile: BusinessProfile | null
  isLoaded: boolean
  loadProfile: () => Promise<void>
  setProfile: (profile: BusinessProfile) => void
  getLabel: (key: string) => string
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoaded: false,

  loadProfile: async () => {
    try {
      const result = await window.api.invoke('profile:get') as {
        success: boolean
        data?: BusinessProfile
      }
      if (result.success && result.data) {
        const profile = {
          ...result.data,
          active_modules: typeof result.data.active_modules === 'string'
            ? JSON.parse(result.data.active_modules as unknown as string)
            : result.data.active_modules,
          custom_labels: typeof result.data.custom_labels === 'string'
            ? JSON.parse(result.data.custom_labels as unknown as string)
            : result.data.custom_labels
        }
        set({ profile, isLoaded: true })
      } else {
        set({ isLoaded: true })
      }
    } catch {
      set({ isLoaded: true })
    }
  },

  setProfile: (profile) => set({ profile, isLoaded: true }),

  getLabel: (key: string) => {
    const { profile } = get()
    return profile?.custom_labels?.[key] || key
  }
}))
