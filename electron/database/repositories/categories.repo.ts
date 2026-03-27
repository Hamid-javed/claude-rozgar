import { getDb } from '../db'

export interface CategoryRow {
  id: number
  name: string
  parent_id: number | null
  business_type: string | null
  color: string | null
  icon: string | null
  created_at: string
  deleted_at: string | null
  product_count?: number
}

export const categoriesRepo = {
  list() {
    return getDb().prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as product_count
      FROM categories c
      WHERE c.deleted_at IS NULL
      ORDER BY c.name ASC
    `).all() as CategoryRow[]
  },

  get(id: number) {
    return getDb().prepare(
      'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL'
    ).get(id) as CategoryRow | undefined
  },

  create(data: { name: string; parent_id?: number; business_type?: string; color?: string; icon?: string }) {
    return getDb().prepare(
      'INSERT INTO categories (name, parent_id, business_type, color, icon) VALUES (?, ?, ?, ?, ?)'
    ).run(data.name, data.parent_id || null, data.business_type || null, data.color || null, data.icon || null)
  },

  update(id: number, data: { name?: string; parent_id?: number; color?: string; icon?: string }) {
    const fields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f as keyof typeof data])
    return getDb().prepare(
      `UPDATE categories SET ${sets} WHERE id = ? AND deleted_at IS NULL`
    ).run(...values, id)
  },

  delete(id: number) {
    // Check if category has products
    const count = getDb().prepare(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL'
    ).get(id) as { count: number }
    if (count.count > 0) {
      throw new Error(`Cannot delete category: ${count.count} products are using it`)
    }
    return getDb().prepare("UPDATE categories SET deleted_at = datetime('now') WHERE id = ?").run(id)
  }
}
