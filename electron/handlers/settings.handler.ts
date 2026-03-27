import { ipcMain } from 'electron'
import { settingsRepo } from '../database/repositories/settings.repo'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get-all', () => {
    try {
      const data = settingsRepo.getAll()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('settings:get', (_event, { key }: { key: string }) => {
    try {
      const value = settingsRepo.get(key)
      return { success: true, value }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('settings:update', (_event, { key, value }: { key: string; value: string }) => {
    try {
      settingsRepo.update(key, value)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
