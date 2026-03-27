import { getDb } from '../db'

export interface SupplierRow {
  id: number
  name: string
  company: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  address: string | null
  area: string | null
  opening_balance: number
  current_balance: number
  notes: string | null
  is_active: number
  created_at: string
  deleted_at: string | null
}

export const suppliersRepo = {
  list(params: { search?: string; is_active?: number } = {}) {
    const conditions: string[] = ['deleted_at IS NULL']
    const values: unknown[] = []
    if (params.search) {
      conditions.push('(name LIKE ? OR company LIKE ? OR phone LIKE ?)')
      const q = `%${params.search}%`
      values.push(q, q, q)
    }
    if (params.is_active !== undefined) {
      conditions.push('is_active = ?')
      values.push(params.is_active)
    }
    const where = `WHERE ${conditions.join(' AND ')}`
    return getDb().prepare(`SELECT * FROM suppliers ${where} ORDER BY name ASC`).all(...values) as SupplierRow[]
  },

  get(id: number) {
    return getDb().prepare('SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL').get(id) as SupplierRow | undefined
  },

  create(data: Record<string, unknown>) {
    const fields = ['name', 'company', 'phone', 'phone2', 'email', 'address', 'area', 'opening_balance', 'current_balance', 'notes', 'is_active']
    const present = fields.filter((f) => data[f] !== undefined)
    const placeholders = present.map(() => '?').join(', ')
    const values = present.map((f) => data[f])

    const result = getDb().prepare(`INSERT INTO suppliers (${present.join(', ')}) VALUES (${placeholders})`).run(...values)

    // If opening balance, create ledger entry
    if (data.opening_balance && Number(data.opening_balance) !== 0) {
      getDb().prepare(`
        INSERT INTO ledger (party_type, party_id, transaction_type, amount, balance_after, description)
        VALUES ('supplier', ?, 'opening', ?, ?, 'Opening balance')
      `).run(result.lastInsertRowid, data.opening_balance, data.opening_balance)
    }

    return result
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at')
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE suppliers SET ${sets} WHERE id = ? AND deleted_at IS NULL`).run(...values, id)
  },

  delete(id: number) {
    return getDb().prepare("UPDATE suppliers SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  getLedger(id: number, dateFrom?: string, dateTo?: string) {
    const conditions = ['party_type = ? AND party_id = ?']
    const values: unknown[] = ['supplier', id]
    if (dateFrom) { conditions.push('created_at >= ?'); values.push(dateFrom) }
    if (dateTo) { conditions.push('created_at <= ?'); values.push(dateTo + 'T23:59:59') }

    return getDb().prepare(`
      SELECT * FROM ledger WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC
    `).all(...values)
  },

  makePayment(data: { supplier_id: number; amount: number; method: string; notes?: string; created_by?: number }) {
    const db = getDb()
    const pay = db.transaction(() => {
      // Update supplier balance
      db.prepare('UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?')
        .run(data.amount, data.supplier_id)

      const supplier = db.prepare('SELECT current_balance FROM suppliers WHERE id = ?').get(data.supplier_id) as { current_balance: number }

      // Ledger entry (negative = payment made)
      db.prepare(`
        INSERT INTO ledger (party_type, party_id, transaction_type, amount, balance_after, description, created_by)
        VALUES ('supplier', ?, 'payment', ?, ?, ?, ?)
      `).run(data.supplier_id, -data.amount, supplier.current_balance, data.notes || 'Payment to supplier', data.created_by || null)

      // Payment record
      const supplierRow = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(data.supplier_id) as { name: string }
      db.prepare(`
        INSERT INTO payments (payment_date, payment_type, party_type, party_id, party_name, amount, payment_method, notes, created_by)
        VALUES (date('now'), 'outgoing', 'supplier', ?, ?, ?, ?, ?, ?)
      `).run(data.supplier_id, supplierRow.name, data.amount, data.method, data.notes || null, data.created_by || null)

      return { balance: supplier.current_balance }
    })
    return pay()
  }
}
