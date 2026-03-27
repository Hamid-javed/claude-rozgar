import { ipcMain } from 'electron'
import { getDb } from '../database/db'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:today-expenses', () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const row = getDb().prepare(`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM expenses
        WHERE expense_date = ? AND deleted_at IS NULL
      `).get(today) as { total: number; count: number }
      return { success: true, data: row }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('dashboard:low-stock', () => {
    try {
      const data = getDb().prepare(`
        SELECT id, name, sku, current_stock, min_stock_alert, unit_id,
          (SELECT abbreviation FROM units WHERE id = products.unit_id) as unit_abbreviation
        FROM products
        WHERE track_stock = 1 AND current_stock <= min_stock_alert
          AND deleted_at IS NULL AND is_active = 1
        ORDER BY current_stock ASC
        LIMIT 10
      `).all()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
