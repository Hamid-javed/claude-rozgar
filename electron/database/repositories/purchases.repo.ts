import { getDb } from '../db'

export interface PurchaseRow {
  id: number
  purchase_number: string
  purchase_date: string
  supplier_id: number | null
  supplier_name: string | null
  subtotal: number
  discount_amount: number
  tax_amount: number
  shipping_cost: number
  grand_total: number
  amount_paid: number
  amount_due: number
  payment_method: string
  status: string
  invoice_ref: string | null
  notes: string | null
  created_by: number | null
  created_at: string
  item_count?: number
}

export interface PurchaseItemRow {
  id: number
  purchase_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_cost: number
  tax_percent: number
  tax_amount: number
  line_total: number
  expiry_date: string | null
  batch_number: string | null
}

interface PurchaseCreateData {
  supplier_id?: number | null
  supplier_name?: string | null
  subtotal: number
  discount_amount?: number
  tax_amount?: number
  shipping_cost?: number
  grand_total: number
  amount_paid?: number
  amount_due?: number
  payment_method?: string
  status?: string
  invoice_ref?: string | null
  notes?: string | null
  created_by?: number | null
  items: {
    product_id: number
    product_name: string
    quantity: number
    unit_cost: number
    tax_percent?: number
    tax_amount?: number
    line_total: number
    expiry_date?: string | null
    batch_number?: string | null
  }[]
}

interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  supplier_id?: number
  status?: string
  date_from?: string
  date_to?: string
}

export const purchasesRepo = {
  generatePurchaseNumber() {
    const db = getDb()
    const row = db.prepare('SELECT MAX(id) as maxId FROM purchases').get() as { maxId: number | null }
    const next = (row.maxId || 0) + 1
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `PO-${year}${month}-${String(next).padStart(5, '0')}`
  },

  create(data: PurchaseCreateData) {
    const db = getDb()
    const purchaseNumber = this.generatePurchaseNumber()
    const purchaseDate = new Date().toISOString().split('T')[0]

    const createPurchase = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO purchases (
          purchase_number, purchase_date, supplier_id, supplier_name,
          subtotal, discount_amount, tax_amount, shipping_cost,
          grand_total, amount_paid, amount_due, payment_method,
          status, invoice_ref, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        purchaseNumber, purchaseDate,
        data.supplier_id || null, data.supplier_name || null,
        data.subtotal,
        data.discount_amount || 0, data.tax_amount || 0, data.shipping_cost || 0,
        data.grand_total,
        data.amount_paid || 0, data.amount_due || 0,
        data.payment_method || 'cash',
        data.status || 'received',
        data.invoice_ref || null, data.notes || null,
        data.created_by || null
      )

      const purchaseId = result.lastInsertRowid as number

      const insertItem = db.prepare(`
        INSERT INTO purchase_items (
          purchase_id, product_id, product_name, quantity, unit_cost,
          tax_percent, tax_amount, line_total, expiry_date, batch_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of data.items) {
        insertItem.run(
          purchaseId, item.product_id, item.product_name, item.quantity, item.unit_cost,
          item.tax_percent || 0, item.tax_amount || 0, item.line_total,
          item.expiry_date || null, item.batch_number || null
        )

        // Update product stock & buy price
        db.prepare(`
          UPDATE products SET
            current_stock = current_stock + ?,
            buy_price = ?,
            updated_at = datetime('now')
          WHERE id = ? AND track_stock = 1
        `).run(item.quantity, item.unit_cost, item.product_id)

        // Record stock movement
        const product = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(item.product_id) as { current_stock: number } | undefined
        if (product) {
          db.prepare(`
            INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, reference_id, reference_type, created_by)
            VALUES (?, 'purchase', ?, ?, ?, ?, 'purchase', ?)
          `).run(
            item.product_id, item.quantity,
            product.current_stock - item.quantity, product.current_stock,
            purchaseId, data.created_by || null
          )
        }
      }

      // Update supplier balance if amount due
      if (data.supplier_id && data.amount_due && data.amount_due > 0) {
        db.prepare('UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?')
          .run(data.amount_due, data.supplier_id)

        db.prepare(`
          INSERT INTO ledger (party_type, party_id, transaction_type, amount, balance_after, reference_id, reference_type, description, created_by)
          VALUES ('supplier', ?, 'invoice', ?, (SELECT current_balance FROM suppliers WHERE id = ?), ?, 'purchase', ?, ?)
        `).run(
          data.supplier_id, data.amount_due, data.supplier_id,
          purchaseId, `Purchase ${purchaseNumber}`, data.created_by || null
        )
      }

      return { purchaseId, purchaseNumber }
    })

    return createPurchase()
  },

  list(params: ListParams = {}) {
    const { page = 1, pageSize = 50, search, supplier_id, status, date_from, date_to } = params
    const conditions: string[] = ['p.deleted_at IS NULL']
    const values: unknown[] = []

    if (search) {
      conditions.push('(p.purchase_number LIKE ? OR p.supplier_name LIKE ?)')
      const q = `%${search}%`
      values.push(q, q)
    }
    if (supplier_id) { conditions.push('p.supplier_id = ?'); values.push(supplier_id) }
    if (status) { conditions.push('p.status = ?'); values.push(status) }
    if (date_from) { conditions.push('p.purchase_date >= ?'); values.push(date_from) }
    if (date_to) { conditions.push('p.purchase_date <= ?'); values.push(date_to) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const offset = (page - 1) * pageSize

    const countRow = getDb().prepare(`SELECT COUNT(*) as total FROM purchases p ${where}`).get(...values) as { total: number }
    const rows = getDb().prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id = p.id) as item_count
      FROM purchases p
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as PurchaseRow[]

    return { data: rows, total: countRow.total, page, pageSize, totalPages: Math.ceil(countRow.total / pageSize) }
  },

  get(id: number) {
    const purchase = getDb().prepare('SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id) as PurchaseRow | undefined
    if (!purchase) return null
    const items = getDb().prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(id) as PurchaseItemRow[]
    return { ...purchase, items }
  },

  delete(id: number) {
    return getDb().prepare("UPDATE purchases SET deleted_at = datetime('now') WHERE id = ?").run(id)
  }
}
