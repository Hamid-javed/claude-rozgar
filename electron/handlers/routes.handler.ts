import { ipcMain } from 'electron'
import { getDb } from '../database/db'

export function registerRoutesHandlers(): void {
  ipcMain.handle('routes:list', () => {
    try {
      const data = getDb().prepare(`
        SELECT r.*, s.name as salesperson_name,
          (SELECT COUNT(*) FROM customers c WHERE c.route_id = r.id AND c.deleted_at IS NULL) as customer_count
        FROM routes r
        LEFT JOIN staff s ON r.salesperson_id = s.id
        WHERE r.is_active = 1
        ORDER BY r.name ASC
      `).all()
      return { success: true, data }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('routes:create', (_event, data: { name: string; area?: string; salesperson_id?: number; visit_days?: string; notes?: string }) => {
    try {
      const result = getDb().prepare('INSERT INTO routes (name, area, salesperson_id, visit_days, notes) VALUES (?, ?, ?, ?, ?)')
        .run(data.name, data.area || null, data.salesperson_id || null, data.visit_days || '[]', data.notes || null)
      return { success: true, id: result.lastInsertRowid }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('routes:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try {
      const fields = Object.keys(data)
      const sets = fields.map((f) => `${f} = ?`).join(', ')
      const values = fields.map((f) => data[f])
      getDb().prepare(`UPDATE routes SET ${sets} WHERE id = ?`).run(...values, id)
      return { success: true }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('routes:delete', (_event, { id }: { id: number }) => {
    try {
      getDb().prepare('UPDATE routes SET is_active = 0 WHERE id = ?').run(id)
      return { success: true }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('routes:sales-summary', (_event, { routeId, dateFrom, dateTo }: { routeId: number; dateFrom?: string; dateTo?: string }) => {
    try {
      const conditions = ['c.route_id = ?', 's.deleted_at IS NULL']
      const values: unknown[] = [routeId]
      if (dateFrom) { conditions.push('s.sale_date >= ?'); values.push(dateFrom) }
      if (dateTo) { conditions.push('s.sale_date <= ?'); values.push(dateTo) }

      const data = getDb().prepare(`
        SELECT c.name as customer_name, COUNT(s.id) as sale_count, COALESCE(SUM(s.grand_total), 0) as total_sales, COALESCE(SUM(s.amount_due), 0) as total_due
        FROM customers c
        LEFT JOIN sales s ON s.customer_id = c.id AND ${conditions.slice(1).join(' AND ')}
        WHERE c.route_id = ? AND c.deleted_at IS NULL
        GROUP BY c.id ORDER BY total_sales DESC
      `).all(...values.slice(1), routeId)
      return { success: true, data }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
