import { getDb } from '../db'

export interface CustomerRow {
  id: number; name: string; phone: string | null; email: string | null
  address: string | null; area: string | null; route_id: number | null
  customer_type: string; opening_balance: number; current_balance: number
  credit_limit: number; loyalty_points: number; notes: string | null
  is_active: number; created_at: string; deleted_at: string | null
}

export const customersRepo = {
  list(params: { search?: string; customer_type?: string; is_active?: number } = {}) {
    const conditions: string[] = ['deleted_at IS NULL']
    const values: unknown[] = []
    if (params.search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)')
      const q = `%${params.search}%`; values.push(q, q, q)
    }
    if (params.customer_type) { conditions.push('customer_type = ?'); values.push(params.customer_type) }
    if (params.is_active !== undefined) { conditions.push('is_active = ?'); values.push(params.is_active) }
    return getDb().prepare(`SELECT * FROM customers WHERE ${conditions.join(' AND ')} ORDER BY name ASC`).all(...values) as CustomerRow[]
  },

  get(id: number) {
    return getDb().prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(id) as CustomerRow | undefined
  },

  create(data: Record<string, unknown>) {
    const fields = ['name', 'phone', 'email', 'address', 'area', 'route_id', 'customer_type', 'opening_balance', 'current_balance', 'credit_limit', 'notes', 'is_active']
    const present = fields.filter((f) => data[f] !== undefined)
    const placeholders = present.map(() => '?').join(', ')
    const values = present.map((f) => data[f])
    const result = getDb().prepare(`INSERT INTO customers (${present.join(', ')}) VALUES (${placeholders})`).run(...values)

    if (data.opening_balance && Number(data.opening_balance) !== 0) {
      getDb().prepare(`INSERT INTO ledger (party_type, party_id, transaction_type, amount, balance_after, description) VALUES ('customer', ?, 'opening', ?, ?, 'Opening balance')`)
        .run(result.lastInsertRowid, data.opening_balance, data.opening_balance)
    }
    return result
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at')
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE customers SET ${sets} WHERE id = ? AND deleted_at IS NULL`).run(...values, id)
  },

  delete(id: number) {
    return getDb().prepare("UPDATE customers SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  getLedger(id: number, dateFrom?: string, dateTo?: string) {
    const conditions = ['party_type = ? AND party_id = ?']
    const values: unknown[] = ['customer', id]
    if (dateFrom) { conditions.push('created_at >= ?'); values.push(dateFrom) }
    if (dateTo) { conditions.push('created_at <= ?'); values.push(dateTo + 'T23:59:59') }
    return getDb().prepare(`SELECT * FROM ledger WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`).all(...values)
  },

  receivePayment(data: { customer_id: number; amount: number; method: string; notes?: string; created_by?: number }) {
    const db = getDb()
    const pay = db.transaction(() => {
      db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE id = ?').run(data.amount, data.customer_id)
      const customer = db.prepare('SELECT current_balance, name FROM customers WHERE id = ?').get(data.customer_id) as { current_balance: number; name: string }

      db.prepare(`INSERT INTO ledger (party_type, party_id, transaction_type, amount, balance_after, description, created_by)
        VALUES ('customer', ?, 'payment', ?, ?, ?, ?)`).run(data.customer_id, -data.amount, customer.current_balance, data.notes || 'Payment received', data.created_by || null)

      db.prepare(`INSERT INTO payments (payment_date, payment_type, party_type, party_id, party_name, amount, payment_method, notes, created_by)
        VALUES (date('now'), 'incoming', 'customer', ?, ?, ?, ?, ?, ?)`).run(data.customer_id, customer.name, data.amount, data.method, data.notes || null, data.created_by || null)

      return { balance: customer.current_balance }
    })
    return pay()
  },

  getOutstanding() {
    return getDb().prepare(`SELECT id, name, phone, current_balance FROM customers WHERE current_balance > 0 AND deleted_at IS NULL AND is_active = 1 ORDER BY current_balance DESC`).all() as CustomerRow[]
  }
}
