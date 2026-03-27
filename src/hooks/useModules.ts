import { useProfileStore } from '@/store/profileStore'

export function useModules() {
  const { profile } = useProfileStore()

  const isModuleActive = (moduleKey: string): boolean => {
    if (!profile) return false
    return profile.active_modules.includes(moduleKey)
  }

  return { isModuleActive, activeModules: profile?.active_modules || [] }
}
