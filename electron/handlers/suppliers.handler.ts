import { ipcMain } from 'electron'
import { suppliersRepo } from '../database/repositories/suppliers.repo'

export function registerSupplierHandlers(): void {
  ipcMain.handle('suppliers:list', (_event, params) => {
    try {
      const data = suppliersRepo.list(params || {})
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('suppliers:get', (_event, { id }: { id: number }) => {
    try {
      const data = suppliersRepo.get(id)
      if (!data) return { success: false, error: 'Supplier not found' }
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('suppliers:create', (_event, data) => {
    try {
      const result = suppliersRepo.create(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('suppliers:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try {
      suppliersRepo.update(id, data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('suppliers:delete', (_event, { id }: { id: number }) => {
    try {
      suppliersRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('suppliers:ledger', (_event, { id, dateFrom, dateTo }: { id: number; dateFrom?: string; dateTo?: string }) => {
    try {
      const data = suppliersRepo.getLedger(id, dateFrom, dateTo)
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('suppliers:make-payment', (_event, data) => {
    try {
      const result = suppliersRepo.makePayment(data)
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
