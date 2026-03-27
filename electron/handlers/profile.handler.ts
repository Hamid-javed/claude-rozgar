import { ipcMain } from 'electron'
import { profileRepo } from '../database/repositories/profile.repo'

export function registerProfileHandlers(): void {
  ipcMain.handle('profile:get', () => {
    try {
      const data = profileRepo.get()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('profile:update', (_event, data: Record<string, unknown>) => {
    try {
      profileRepo.update(data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('profile:create', (_event, data) => {
    try {
      profileRepo.create(data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('profile:exists', () => {
    try {
      return { success: true, exists: profileRepo.exists() }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
