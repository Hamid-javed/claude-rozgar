import { ipcMain } from 'electron'
import { purchasesRepo } from '../database/repositories/purchases.repo'

export function registerPurchaseHandlers(): void {
  ipcMain.handle('purchases:list', (_event, params) => {
    try {
      const result = purchasesRepo.list(params || {})
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('purchases:get', (_event, { id }: { id: number }) => {
    try {
      const data = purchasesRepo.get(id)
      if (!data) return { success: false, error: 'Purchase not found' }
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('purchases:create', (_event, data) => {
    try {
      const result = purchasesRepo.create(data)
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('purchases:delete', (_event, { id }: { id: number }) => {
    try {
      purchasesRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
