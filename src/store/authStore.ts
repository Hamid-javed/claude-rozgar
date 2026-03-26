import { create } from 'zustand'

export interface User {
  id: number
  name: string
  username: string
  role: 'owner' | 'manager' | 'cashier' | 'staff'
  permissions: Record<string, boolean>
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const result = await window.api.invoke('auth:login', { username, password }) as {
        success: boolean
        user?: User
        error?: string
      }
      if (result.success && result.user) {
        set({ user: result.user, isLoading: false })
        return true
      }
      set({ isLoading: false })
      return false
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  logout: () => {
    window.api.invoke('auth:logout')
    set({ user: null })
  },

  setUser: (user) => set({ user })
}))
