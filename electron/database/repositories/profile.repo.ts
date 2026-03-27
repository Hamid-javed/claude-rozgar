import { getDb } from '../db'

export const profileRepo = {
  get() {
    return getDb().prepare('SELECT * FROM business_profile WHERE id = 1').get()
  },

  create(data: {
    name: string
    type: string
    logo_path?: string
    address?: string
    phone?: string
    email?: string
    tax_id?: string
    currency_symbol?: string
    currency_code?: string
    active_modules: string
    custom_labels?: string
    invoice_prefix?: string
    receipt_footer?: string
  }) {
    const stmt = getDb().prepare(`
      INSERT INTO business_profile (id, name, type, logo_path, address, phone, email, tax_id,
        currency_symbol, currency_code, active_modules, custom_labels, invoice_prefix, receipt_footer)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      data.name, data.type, data.logo_path || null, data.address || null,
      data.phone || null, data.email || null, data.tax_id || null,
      data.currency_symbol || 'Rs.', data.currency_code || 'PKR',
      data.active_modules, data.custom_labels || '{}',
      data.invoice_prefix || 'INV', data.receipt_footer || null
    )
  },

  update(data: Record<string, unknown>) {
    const fields = Object.keys(data)
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE business_profile SET ${sets}, updated_at = datetime('now') WHERE id = 1`).run(...values)
  },

  exists() {
    const row = getDb().prepare('SELECT COUNT(*) as count FROM business_profile').get() as { count: number }
    return row.count > 0
  }
}
