import { getDb } from '../db'

export interface ProductRow {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  category_id: number | null
  unit_id: number | null
  description: string | null
  buy_price: number
  sale_price: number
  min_sale_price: number
  wholesale_price: number
  tax_percent: number
  image_path: string | null
  track_stock: number
  current_stock: number
  min_stock_alert: number
  max_stock: number
  expiry_date: string | null
  batch_number: string | null
  manufacturer: string | null
  serial_number: string | null
  size_variants: string
  is_active: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  category_name?: string
  unit_name?: string
  unit_abbreviation?: string
}

interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  category_id?: number
  is_active?: number
  low_stock?: boolean
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export const productsRepo = {
  list(params: ListParams = {}) {
    const {
      page = 1,
      pageSize = 50,
      search,
      category_id,
      is_active,
      low_stock,
      sort_by = 'name',
      sort_dir = 'asc'
    } = params

    const conditions: string[] = ['p.deleted_at IS NULL']
    const values: unknown[] = []

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)')
      const q = `%${search}%`
      values.push(q, q, q)
    }
    if (category_id) {
      conditions.push('p.category_id = ?')
      values.push(category_id)
    }
    if (is_active !== undefined) {
      conditions.push('p.is_active = ?')
      values.push(is_active)
    }
    if (low_stock) {
      conditions.push('p.track_stock = 1 AND p.current_stock <= p.min_stock_alert')
    }

    const allowedSorts = ['name', 'sale_price', 'buy_price', 'current_stock', 'created_at', 'sku']
    const safeSort = allowedSorts.includes(sort_by) ? sort_by : 'name'
    const safeDir = sort_dir === 'desc' ? 'DESC' : 'ASC'

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * pageSize

    const countRow = getDb().prepare(
      `SELECT COUNT(*) as total FROM products p ${where}`
    ).get(...values) as { total: number }

    const rows = getDb().prepare(`
      SELECT p.*, c.name as category_name, u.name as unit_name, u.abbreviation as unit_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      ${where}
      ORDER BY p.${safeSort} ${safeDir}
      LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset) as ProductRow[]

    return {
      data: rows,
      total: countRow.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRow.total / pageSize)
    }
  },

  get(id: number) {
    return getDb().prepare(`
      SELECT p.*, c.name as category_name, u.name as unit_name, u.abbreviation as unit_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `).get(id) as ProductRow | undefined
  },

  create(data: Record<string, unknown>) {
    const fields = [
      'name', 'sku', 'barcode', 'category_id', 'unit_id', 'description',
      'buy_price', 'sale_price', 'min_sale_price', 'wholesale_price', 'tax_percent',
      'image_path', 'track_stock', 'current_stock', 'min_stock_alert', 'max_stock',
      'expiry_date', 'batch_number', 'manufacturer', 'serial_number', 'size_variants',
      'is_active', 'notes'
    ]
    const present = fields.filter((f) => data[f] !== undefined)
    const placeholders = present.map(() => '?').join(', ')
    const values = present.map((f) => data[f])

    const result = getDb().prepare(
      `INSERT INTO products (${present.join(', ')}) VALUES (${placeholders})`
    ).run(...values)

    // Record opening stock movement if stock > 0
    if (data.current_stock && Number(data.current_stock) > 0 && data.track_stock !== 0) {
      getDb().prepare(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, notes, created_by)
        VALUES (?, 'opening', ?, 0, ?, 'Opening stock', ?)
      `).run(result.lastInsertRowid, data.current_stock, data.current_stock, data.created_by || null)
    }

    return result
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at')
    if (fields.length === 0) return

    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])

    return getDb().prepare(
      `UPDATE products SET ${sets}, updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`
    ).run(...values, id)
  },

  delete(id: number) {
    return getDb().prepare(
      "UPDATE products SET deleted_at = datetime('now') WHERE id = ?"
    ).run(id)
  },

  search(query: string, limit = 20) {
    const q = `%${query}%`
    return getDb().prepare(`
      SELECT p.*, c.name as category_name, u.abbreviation as unit_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.deleted_at IS NULL AND p.is_active = 1
        AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
      ORDER BY p.name ASC
      LIMIT ?
    `).all(q, q, q, limit) as ProductRow[]
  },

  getByBarcode(barcode: string) {
    return getDb().prepare(`
      SELECT p.*, c.name as category_name, u.abbreviation as unit_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.barcode = ? AND p.deleted_at IS NULL AND p.is_active = 1
    `).get(barcode) as ProductRow | undefined
  },

  adjustStock(id: number, type: string, quantity: number, reason: string, userId?: number) {
    const db = getDb()
    const product = db.prepare('SELECT current_stock FROM products WHERE id = ? AND deleted_at IS NULL').get(id) as { current_stock: number } | undefined
    if (!product) throw new Error('Product not found')

    let newStock: number
    if (type === 'add') {
      newStock = product.current_stock + quantity
    } else if (type === 'remove') {
      newStock = product.current_stock - quantity
    } else if (type === 'set') {
      newStock = quantity
    } else {
      throw new Error('Invalid adjustment type')
    }

    if (newStock < 0) throw new Error('Stock cannot go below zero')

    const adjust = db.transaction(() => {
      db.prepare('UPDATE products SET current_stock = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStock, id)

      db.prepare(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, notes, created_by)
        VALUES (?, 'adjustment', ?, ?, ?, ?, ?)
      `).run(id, type === 'set' ? newStock - product.current_stock : (type === 'add' ? quantity : -quantity), product.current_stock, newStock, reason, userId || null)
    })
    adjust()

    return { current_stock: newStock }
  },

  getStockMovements(params: { product_id?: number; movement_type?: string; page?: number; pageSize?: number } = {}) {
    const { product_id, movement_type, page = 1, pageSize = 50 } = params
    const conditions: string[] = []
    const values: unknown[] = []

    if (product_id) { conditions.push('sm.product_id = ?'); values.push(product_id) }
    if (movement_type) { conditions.push('sm.movement_type = ?'); values.push(movement_type) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * pageSize

    const countRow = getDb().prepare(`SELECT COUNT(*) as total FROM stock_movements sm ${where}`).get(...values) as { total: number }

    const rows = getDb().prepare(`
      SELECT sm.*, p.name as product_name, p.sku as product_sku, u.name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${where}
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset)

    return { data: rows, total: countRow.total, page, pageSize, totalPages: Math.ceil(countRow.total / pageSize) }
  },

  getLowStockProducts(limit = 50) {
    return getDb().prepare(`
      SELECT p.*, c.name as category_name, u.abbreviation as unit_abbreviation
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.track_stock = 1 AND p.current_stock <= p.min_stock_alert
        AND p.deleted_at IS NULL AND p.is_active = 1
      ORDER BY p.current_stock ASC
      LIMIT ?
    `).all(limit) as ProductRow[]
  },

  generateSku() {
    const row = getDb().prepare('SELECT MAX(id) as maxId FROM products').get() as { maxId: number | null }
    const nextId = (row.maxId || 0) + 1
    return `SKU-${String(nextId).padStart(5, '0')}`
  }
}
