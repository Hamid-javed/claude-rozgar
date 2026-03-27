import { ipcMain } from 'electron'
import { getDb } from '../database/db'

export function registerAuditHandlers(): void {
  ipcMain.handle('audit:list', (_event, params: { page?: number; entity_type?: string; user_id?: number; date_from?: string; date_to?: string } = {}) => {
    try {
      const { page = 1, entity_type, user_id, date_from, date_to } = params
      const pageSize = 50
      const conditions: string[] = []
      const values: unknown[] = []

      if (entity_type) { conditions.push('a.entity_type = ?'); values.push(entity_type) }
      if (user_id) { conditions.push('a.user_id = ?'); values.push(user_id) }
      if (date_from) { conditions.push('a.created_at >= ?'); values.push(date_from) }
      if (date_to) { conditions.push('a.created_at <= ?'); values.push(date_to + 'T23:59:59') }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const offset = (page - 1) * pageSize

      const countRow = getDb().prepare(`SELECT COUNT(*) as total FROM audit_log a ${where}`).get(...values) as { total: number }
      const data = getDb().prepare(`
        SELECT a.*, u.name as user_name FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?
      `).all(...values, pageSize, offset)

      return { success: true, data, total: countRow.total, page, pageSize }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('audit:log', (_event, data: { user_id?: number; action: string; entity_type?: string; entity_id?: number; old_value?: string; new_value?: string }) => {
    try {
      getDb().prepare('INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)')
        .run(data.user_id || null, data.action, data.entity_type || null, data.entity_id || null, data.old_value || null, data.new_value || null)
      return { success: true }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
