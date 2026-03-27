import { ipcMain } from 'electron'
import { salesRepo } from '../database/repositories/sales.repo'

export function registerSalesHandlers(): void {
  ipcMain.handle('sales:list', (_event, params) => {
    try {
      const result = salesRepo.list(params || {})
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('sales:get', (_event, { id }: { id: number }) => {
    try {
      const data = salesRepo.get(id)
      if (!data) return { success: false, error: 'Sale not found' }
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('sales:create', (_event, data) => {
    try {
      const result = salesRepo.create(data)
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('sales:return', (_event, data) => {
    try {
      const result = salesRepo.createReturn(data)
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('sales:delete', (_event, { id }: { id: number }) => {
    try {
      salesRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Dashboard data
  ipcMain.handle('dashboard:today-stats', () => {
    try {
      const data = salesRepo.getTodayStats()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('dashboard:recent-sales', (_event, params?: { limit?: number }) => {
    try {
      const data = salesRepo.getRecentSales(params?.limit)
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('dashboard:revenue-chart', () => {
    try {
      const data = salesRepo.getLast7DaysRevenue()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
