import { getDb } from '../db'

export interface DiscountRow {
  id: number
  name: string
  discount_type: string
  value: number | null
  min_purchase: number
  applies_to: string
  applies_ids: string
  customer_type: string
  start_date: string | null
  end_date: string | null
  is_active: number
  usage_count: number
  max_uses: number
  created_at: string
}

export const discountsRepo = {
  list(params: { is_active?: number } = {}) {
    const conditions: string[] = ['deleted_at IS NULL']
    const values: unknown[] = []
    if (params.is_active !== undefined) { conditions.push('is_active = ?'); values.push(params.is_active) }
    return getDb().prepare(`SELECT * FROM discounts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`).all(...values) as DiscountRow[]
  },

  get(id: number) {
    return getDb().prepare('SELECT * FROM discounts WHERE id = ? AND deleted_at IS NULL').get(id) as DiscountRow | undefined
  },

  create(data: Record<string, unknown>) {
    const fields = ['name', 'discount_type', 'value', 'min_purchase', 'applies_to', 'applies_ids', 'customer_type', 'start_date', 'end_date', 'is_active', 'max_uses']
    const present = fields.filter((f) => data[f] !== undefined)
    const placeholders = present.map(() => '?').join(', ')
    const values = present.map((f) => data[f])
    return getDb().prepare(`INSERT INTO discounts (${present.join(', ')}) VALUES (${placeholders})`).run(...values)
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at')
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE discounts SET ${sets} WHERE id = ? AND deleted_at IS NULL`).run(...values, id)
  },

  delete(id: number) {
    return getDb().prepare("UPDATE discounts SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  getApplicable(subtotal: number, customerType: string = 'retail') {
    const today = new Date().toISOString().split('T')[0]
    return getDb().prepare(`
      SELECT * FROM discounts
      WHERE is_active = 1 AND deleted_at IS NULL
        AND min_purchase <= ?
        AND (customer_type = 'all' OR customer_type = ?)
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
        AND (max_uses = 0 OR usage_count < max_uses)
      ORDER BY value DESC
    `).all(subtotal, customerType, today, today) as DiscountRow[]
  },

  incrementUsage(id: number) {
    return getDb().prepare('UPDATE discounts SET usage_count = usage_count + 1 WHERE id = ?').run(id)
  }
}
