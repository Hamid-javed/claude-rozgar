import { ipcMain } from 'electron'
import { authRepo } from '../database/repositories/auth.repo'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', (_event, { username, password }: { username: string; password: string }) => {
    try {
      const user = authRepo.login(username, password)
      if (!user) {
        return { success: false, error: 'Invalid username or password' }
      }
      return { success: true, user }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('auth:logout', () => {
    return { success: true }
  })

  ipcMain.handle('auth:change-password', (_event, { id, newPassword }: { id: number; newPassword: string }) => {
    try {
      authRepo.changePassword(id, newPassword)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('auth:user-exists', () => {
    try {
      return { success: true, exists: authRepo.userExists() }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  // User management
  ipcMain.handle('users:list', () => {
    try {
      const data = authRepo.getUsers()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('users:create', (_event, data) => {
    try {
      const result = authRepo.createUser(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('users:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try {
      authRepo.updateUser(id, data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('users:delete', (_event, { id }: { id: number }) => {
    try {
      authRepo.deleteUser(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('users:reset-password', (_event, { id, password }: { id: number; password: string }) => {
    try {
      authRepo.changePassword(id, password)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
