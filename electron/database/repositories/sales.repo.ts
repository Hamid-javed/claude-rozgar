import { getDb } from '../db'

export interface SaleRow {
  id: number
  invoice_number: string
  sale_date: string
  customer_id: number | null
  customer_name: string | null
  sale_type: string
  subtotal: number
  discount_type: string | null
  discount_value: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  amount_paid: number
  amount_due: number
  payment_method: string
  payment_details: string
  status: string
  notes: string | null
  table_number: string | null
  waiter_id: number | null
  created_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  item_count?: number
}

export interface SaleItemRow {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  product_sku: string | null
  quantity: number
  unit_price: number
  buy_price: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  line_total: number
  notes: string | null
}

interface SaleCreateData {
  customer_id?: number | null
  customer_name?: string | null
  sale_type?: string
  subtotal: number
  discount_type?: string | null
  discount_value?: number
  discount_amount?: number
  tax_amount?: number
  grand_total: number
  amount_paid?: number
  amount_due?: number
  payment_method?: string
  payment_details?: string
  status?: string
  notes?: string | null
  table_number?: string | null
  waiter_id?: number | null
  created_by?: number | null
  items: {
    product_id: number
    product_name: string
    product_sku?: string | null
    quantity: number
    unit_price: number
    buy_price: number
    discount_percent?: number
    discount_amount?: number
    tax_percent?: number
    tax_amount?: number
    line_total: number
  }[]
}

interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  customer_id?: number
  status?: string
  sale_type?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export const salesRepo = {
  generateInvoiceNumber() {
    const db = getDb()
    const profile = db.prepare('SELECT invoice_prefix, invoice_counter FROM business_profile WHERE id = 1').get() as {
      invoice_prefix: string; invoice_counter: number
    } | undefined

    const prefix = profile?.invoice_prefix || 'INV'
    const counter = profile?.invoice_counter || 1
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const seq = String(counter).padStart(5, '0')
    const invoiceNumber = `${prefix}-${year}${month}-${seq}`

    // Increment counter
    db.prepare('UPDATE business_profile SET invoice_counter = invoice_counter + 1 WHERE id = 1').run()

    return invoiceNumber
  },

  create(data: SaleCreateData) {
    const db = getDb()
    const invoiceNumber = this.generateInvoiceNumber()
    const saleDate = new Date().toISOString().split('T')[0]

    const createSale = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO sales (
          invoice_number, sale_date, customer_id, customer_name, sale_type,
          subtotal, discount_type, discount_value, discount_amount, tax_amount,
          grand_total, amount_paid, amount_due, payment_method, payment_details,
          status, notes, table_number, waiter_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceNumber, saleDate,
        data.customer_id || null, data.customer_name || null,
        data.sale_type || 'retail',
        data.subtotal,
        data.discount_type || null, data.discount_value || 0, data.discount_amount || 0,
        data.tax_amount || 0,
        data.grand_total,
        data.amount_paid || 0, data.amount_due || 0,
        data.payment_method || 'cash',
        data.payment_details || '{}',
        data.status || 'paid',
        data.notes || null,
        data.table_number || null, data.waiter_id || null,
        data.created_by || null
      )

      const saleId = result.lastInsertRowid as number

      // Insert sale items
      const insertItem = db.prepare(`
        INSERT INTO sale_items (
          sale_id, product_id, product_name, product_sku,
          quantity, unit_price, buy_price,
          discount_percent, discount_amount, tax_percent, tax_amount, line_total, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const item of data.items) {
        insertItem.run(
          saleId, item.product_id, item.product_name, item.product_sku || null,
          item.quantity, item.unit_price, item.buy_price,
          item.discount_percent || 0, item.discount_amount || 0,
          item.tax_percent || 0, item.tax_amount || 0, item.line_total, null
        )

        // Update product stock
        db.prepare(`
          UPDATE products SET current_stock = current_stock - ?, updated_at = datetime('now')
          WHERE id = ? AND track_stock = 1
        `).run(item.quantity, item.product_id)

        // Record stock movement
        const product = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(item.product_id) as { current_stock: number } | undefined
        if (product) {
          db.prepare(`
            INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, reference_id, reference_type, created_by)
            VALUES (?, 'sale', ?, ?, ?, ?, 'sale', ?)
          `).run(
            item.product_id, -item.quantity,
            product.current_stock + item.quantity, product.current_stock,
            saleId, data.created_by || null
          )
        }
      }

      // Update customer balance if credit sale
      if (data.customer_id && data.amount_due && data.amount_due > 0) {
        db.prepare('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?')
          .run(data.amount_due, data.customer_id)

        db.prepare(`
          INSERT INTO ledger (party_type, party_id, transaction_type, amount, balance_after, reference_id, reference_type, description, created_by)
          VALUES ('customer', ?, 'invoice', ?, (SELECT current_balance FROM customers WHERE id = ?), ?, 'sale', ?, ?)
        `).run(
          data.customer_id, data.amount_due, data.customer_id,
          saleId, `Sale ${invoiceNumber}`, data.created_by || null
        )
      }

      return { saleId, invoiceNumber }
    })

    return createSale()
  },

  list(params: ListParams = {}) {
    const {
      page = 1, pageSize = 50, search, customer_id, status, sale_type,
      date_from, date_to, sort_by = 'created_at', sort_dir = 'desc'
    } = params

    const conditions: string[] = ['s.deleted_at IS NULL']
    const values: unknown[] = []

    if (search) {
      conditions.push('(s.invoice_number LIKE ? OR s.customer_name LIKE ?)')
      const q = `%${search}%`
      values.push(q, q)
    }
    if (customer_id) { conditions.push('s.customer_id = ?'); values.push(customer_id) }
    if (status) { conditions.push('s.status = ?'); values.push(status) }
    if (sale_type) { conditions.push('s.sale_type = ?'); values.push(sale_type) }
    if (date_from) { conditions.push('s.sale_date >= ?'); values.push(date_from) }
    if (date_to) { conditions.push('s.sale_date <= ?'); values.push(date_to) }

    const allowedSorts = ['created_at', 'sale_date', 'grand_total', 'invoice_number']
    const safeSort = allowedSorts.includes(sort_by) ? sort_by : 'created_at'
    const safeDir = sort_dir === 'asc' ? 'ASC' : 'DESC'

    const where = `WHERE ${conditions.join(' AND ')}`
    const offset = (page - 1) * pageSize

    const countRow = getDb().prepare(`SELECT COUNT(*) as total FROM sales s ${where}`).get(...values) as { total: number }

    const rows = getDb().prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      ${where}
      ORDER BY s.${safeSort} ${safeDir}
      LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as SaleRow[]

    return {
      data: rows,
      total: countRow.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRow.total / pageSize)
    }
  },

  get(id: number) {
    const sale = getDb().prepare(`
      SELECT s.* FROM sales s WHERE s.id = ? AND s.deleted_at IS NULL
    `).get(id) as SaleRow | undefined
    if (!sale) return null

    const items = getDb().prepare(`
      SELECT si.* FROM sale_items si WHERE si.sale_id = ?
    `).all(id) as SaleItemRow[]

    return { ...sale, items }
  },

  delete(id: number) {
    return getDb().prepare("UPDATE sales SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  createReturn(data: {
    original_sale_id: number; return_reason: string; refund_method: string
    created_by?: number; items: { sale_item_id: number; product_id: number; product_name: string; quantity: number; unit_price: number; line_total: number }[]
  }) {
    const db = getDb()
    const totalAmount = data.items.reduce((sum, i) => sum + i.line_total, 0)
    const returnNumber = `RET-${Date.now()}`

    const doReturn = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO sale_returns (return_number, original_sale_id, return_date, return_reason, total_amount, refund_method, created_by)
        VALUES (?, ?, date('now'), ?, ?, ?, ?)
      `).run(returnNumber, data.original_sale_id, data.return_reason, totalAmount, data.refund_method, data.created_by || null)

      const returnId = result.lastInsertRowid as number
      const insertItem = db.prepare(`INSERT INTO sale_return_items (return_id, sale_item_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`)

      for (const item of data.items) {
        insertItem.run(returnId, item.sale_item_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total)

        // Restore stock
        db.prepare('UPDATE products SET current_stock = current_stock + ?, updated_at = datetime(\'now\') WHERE id = ? AND track_stock = 1').run(item.quantity, item.product_id)

        const product = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(item.product_id) as { current_stock: number } | undefined
        if (product) {
          db.prepare(`INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, reference_id, reference_type, created_by)
            VALUES (?, 'return', ?, ?, ?, ?, 'return', ?)`).run(
            item.product_id, item.quantity, product.current_stock - item.quantity, product.current_stock, returnId, data.created_by || null)
        }
      }

      // Update sale status
      db.prepare("UPDATE sales SET status = 'returned', updated_at = datetime('now') WHERE id = ?").run(data.original_sale_id)

      return { returnId, returnNumber, totalAmount }
    })
    return doReturn()
  },

  getTodayStats() {
    const today = new Date().toISOString().split('T')[0]
    const db = getDb()

    const salesStats = db.prepare(`
      SELECT
        COALESCE(SUM(grand_total), 0) as total_sales,
        COUNT(*) as sale_count,
        COALESCE(SUM(amount_paid), 0) as total_received
      FROM sales
      WHERE sale_date = ? AND deleted_at IS NULL AND status != 'cancelled'
    `).get(today) as { total_sales: number; sale_count: number; total_received: number }

    // Profit calculation: sum(sale_price * qty) - sum(buy_price * qty)
    const profitRow = db.prepare(`
      SELECT COALESCE(SUM(si.line_total - (si.buy_price * si.quantity)), 0) as profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date = ? AND s.deleted_at IS NULL AND s.status != 'cancelled'
    `).get(today) as { profit: number }

    return { ...salesStats, profit: profitRow.profit }
  },

  getRecentSales(limit = 10) {
    return getDb().prepare(`
      SELECT s.id, s.invoice_number, s.sale_date, s.customer_name, s.grand_total, s.status, s.payment_method,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT ?
    `).all(limit) as SaleRow[]
  },

  getLast7DaysRevenue() {
    return getDb().prepare(`
      SELECT sale_date as date, COALESCE(SUM(grand_total), 0) as total
      FROM sales
      WHERE sale_date >= date('now', '-7 days') AND deleted_at IS NULL AND status != 'cancelled'
      GROUP BY sale_date
      ORDER BY sale_date ASC
    `).all() as { date: string; total: number }[]
  }
}
