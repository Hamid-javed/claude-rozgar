import { ipcMain } from 'electron'
import { getDb } from '../database/db'

export function registerPharmacyHandlers(): void {
  ipcMain.handle('pharmacy:expiry-alerts', (_event, { days }: { days?: number } = {}) => {
    try {
      const d = days || 30
      const data = getDb().prepare(`
        SELECT id, name, sku, barcode, batch_number, manufacturer, expiry_date, current_stock,
          CAST(julianday(expiry_date) - julianday('now') AS INTEGER) as days_until_expiry
        FROM products
        WHERE expiry_date IS NOT NULL AND expiry_date != ''
          AND deleted_at IS NULL AND is_active = 1
          AND julianday(expiry_date) - julianday('now') <= ?
        ORDER BY expiry_date ASC
      `).all(d)
      return { success: true, data }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('pharmacy:batch-list', (_event, { productId }: { productId?: number } = {}) => {
    try {
      const conditions: string[] = ['deleted_at IS NULL', 'is_active = 1', "batch_number IS NOT NULL AND batch_number != ''"]
      const values: unknown[] = []
      if (productId) { conditions.push('id = ?'); values.push(productId) }

      const data = getDb().prepare(`
        SELECT id, name, sku, batch_number, manufacturer, expiry_date, current_stock
        FROM products WHERE ${conditions.join(' AND ')}
        ORDER BY expiry_date ASC
      `).all(...values)
      return { success: true, data }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
