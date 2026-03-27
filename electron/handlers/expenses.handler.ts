import { ipcMain } from 'electron'
import { expensesRepo } from '../database/repositories/expenses.repo'

export function registerExpenseHandlers(): void {
  ipcMain.handle('expenses:list', (_event, params) => {
    try {
      const result = expensesRepo.list(params || {})
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expenses:create', (_event, data) => {
    try {
      const result = expensesRepo.create(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expenses:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try {
      expensesRepo.update(id, data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expenses:delete', (_event, { id }: { id: number }) => {
    try {
      expensesRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expenses:today-summary', () => {
    try {
      const data = expensesRepo.getTodaySummary()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expenses:monthly-summary', (_event, { month }: { month: string }) => {
    try {
      const data = expensesRepo.getMonthlySummaryByCategory(month)
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Categories
  ipcMain.handle('expense-categories:list', () => {
    try {
      const data = expensesRepo.listCategories()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expense-categories:create', (_event, data) => {
    try {
      const result = expensesRepo.createCategory(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('expense-categories:delete', (_event, { id }: { id: number }) => {
    try {
      expensesRepo.deleteCategory(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
