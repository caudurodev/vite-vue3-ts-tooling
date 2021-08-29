import { useLocalStorage } from '@vueuse/core'

export const currentTabLanguage = useLocalStorage(
  'currentTabLanguage',
  'rt',
  { listenToStorageChanges: true },
)
