import { getDb } from '../db'

export interface UnitRow {
  id: number
  name: string
  abbreviation: string
}

export const unitsRepo = {
  list() {
    return getDb().prepare('SELECT * FROM units ORDER BY name ASC').all() as UnitRow[]
  },

  create(data: { name: string; abbreviation: string }) {
    return getDb().prepare(
      'INSERT INTO units (name, abbreviation) VALUES (?, ?)'
    ).run(data.name, data.abbreviation)
  },

  delete(id: number) {
    const count = getDb().prepare(
      'SELECT COUNT(*) as count FROM products WHERE unit_id = ? AND deleted_at IS NULL'
    ).get(id) as { count: number }
    if (count.count > 0) {
      throw new Error(`Cannot delete unit: ${count.count} products are using it`)
    }
    return getDb().prepare('DELETE FROM units WHERE id = ?').run(id)
  }
}
