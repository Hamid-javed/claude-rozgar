import { useProfileStore } from '@/store/profileStore'

/** Returns the custom label for a key, or the default if no custom label is set */
export function useLabel() {
  const { profile } = useProfileStore()

  return (key: string, defaultLabel?: string): string => {
    return profile?.custom_labels?.[key] || defaultLabel || key
  }
}
