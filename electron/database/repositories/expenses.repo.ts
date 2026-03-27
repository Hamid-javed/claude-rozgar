import { getDb } from '../db'

export interface ExpenseRow {
  id: number
  expense_date: string
  category_id: number | null
  category_name: string | null
  title: string
  amount: number
  payment_method: string
  paid_to: string | null
  reference: string | null
  notes: string | null
  created_by: number | null
  created_at: string
}

export interface ExpenseCategoryRow {
  id: number
  name: string
  icon: string | null
  color: string | null
  is_daily: number
  expense_count?: number
  total_amount?: number
}

interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  category_id?: number
  date_from?: string
  date_to?: string
  payment_method?: string
}

export const expensesRepo = {
  list(params: ListParams = {}) {
    const { page = 1, pageSize = 50, search, category_id, date_from, date_to, payment_method } = params
    const conditions: string[] = ['e.deleted_at IS NULL']
    const values: unknown[] = []

    if (search) {
      conditions.push('(e.title LIKE ? OR e.paid_to LIKE ? OR e.category_name LIKE ?)')
      const q = `%${search}%`
      values.push(q, q, q)
    }
    if (category_id) { conditions.push('e.category_id = ?'); values.push(category_id) }
    if (date_from) { conditions.push('e.expense_date >= ?'); values.push(date_from) }
    if (date_to) { conditions.push('e.expense_date <= ?'); values.push(date_to) }
    if (payment_method) { conditions.push('e.payment_method = ?'); values.push(payment_method) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const offset = (page - 1) * pageSize

    const countRow = getDb().prepare(`SELECT COUNT(*) as total FROM expenses e ${where}`).get(...values) as { total: number }
    const rows = getDb().prepare(`
      SELECT e.* FROM expenses e ${where} ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as ExpenseRow[]

    return { data: rows, total: countRow.total, page, pageSize, totalPages: Math.ceil(countRow.total / pageSize) }
  },

  create(data: Record<string, unknown>) {
    const fields = ['expense_date', 'category_id', 'category_name', 'title', 'amount', 'payment_method', 'paid_to', 'reference', 'notes', 'created_by']
    const present = fields.filter((f) => data[f] !== undefined)
    const placeholders = present.map(() => '?').join(', ')
    const values = present.map((f) => data[f])
    return getDb().prepare(`INSERT INTO expenses (${present.join(', ')}) VALUES (${placeholders})`).run(...values)
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at' && k !== 'created_by')
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE expenses SET ${sets}, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`).run(...values, id)
  },

  delete(id: number) {
    return getDb().prepare("UPDATE expenses SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  getTodaySummary() {
    const today = new Date().toISOString().split('T')[0]
    return getDb().prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM expenses WHERE expense_date = ? AND deleted_at IS NULL
    `).get(today) as { total: number; count: number }
  },

  getMonthlySummaryByCategory(month: string) {
    // month format: YYYY-MM
    return getDb().prepare(`
      SELECT category_name, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM expenses
      WHERE expense_date LIKE ? AND deleted_at IS NULL
      GROUP BY category_name
      ORDER BY total DESC
    `).all(`${month}%`) as { category_name: string; total: number; count: number }[]
  },

  // Expense categories
  listCategories() {
    return getDb().prepare(`
      SELECT ec.*,
        (SELECT COUNT(*) FROM expenses e WHERE e.category_id = ec.id AND e.deleted_at IS NULL) as expense_count,
        (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.category_id = ec.id AND e.deleted_at IS NULL) as total_amount
      FROM expense_categories ec
      WHERE ec.deleted_at IS NULL
      ORDER BY ec.is_daily DESC, ec.name ASC
    `).all() as ExpenseCategoryRow[]
  },

  createCategory(data: { name: string; icon?: string; color?: string; is_daily?: number }) {
    return getDb().prepare(
      'INSERT INTO expense_categories (name, icon, color, is_daily) VALUES (?, ?, ?, ?)'
    ).run(data.name, data.icon || null, data.color || null, data.is_daily || 0)
  },

  updateCategory(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data)
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE expense_categories SET ${sets} WHERE id = ?`).run(...values, id)
  },

  deleteCategory(id: number) {
    const count = getDb().prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ? AND deleted_at IS NULL').get(id) as { count: number }
    if (count.count > 0) throw new Error(`Cannot delete: ${count.count} expenses use this category`)
    return getDb().prepare("UPDATE expense_categories SET deleted_at = datetime('now') WHERE id = ?").run(id)
  }
}
