import { getDb } from '../db'

export const reportsRepo = {
  financialSummary(dateFrom: string, dateTo: string) {
    const db = getDb()
    const sales = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count,
        COALESCE(SUM(amount_paid), 0) as received, COALESCE(SUM(amount_due), 0) as receivable
      FROM sales WHERE sale_date BETWEEN ? AND ? AND deleted_at IS NULL AND status != 'cancelled'
    `).get(dateFrom, dateTo) as any

    const purchases = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count,
        COALESCE(SUM(amount_paid), 0) as paid, COALESCE(SUM(amount_due), 0) as payable
      FROM purchases WHERE purchase_date BETWEEN ? AND ? AND deleted_at IS NULL AND status != 'cancelled'
    `).get(dateFrom, dateTo) as any

    const expenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM expenses WHERE expense_date BETWEEN ? AND ? AND deleted_at IS NULL
    `).get(dateFrom, dateTo) as any

    const profit = db.prepare(`
      SELECT COALESCE(SUM(si.line_total - (si.buy_price * si.quantity)), 0) as gross_profit
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.deleted_at IS NULL AND s.status != 'cancelled'
    `).get(dateFrom, dateTo) as any

    const payroll = db.prepare(`
      SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll
      WHERE month BETWEEN ? AND ? AND status = 'paid'
    `).get(dateFrom.substring(0, 7), dateTo.substring(0, 7)) as any

    return {
      sales: { ...sales },
      purchases: { ...purchases },
      expenses: { ...expenses },
      grossProfit: profit.gross_profit,
      netProfit: profit.gross_profit - expenses.total - payroll.total,
      payroll: payroll.total
    }
  },

  salesReport(dateFrom: string, dateTo: string, groupBy: string = 'day') {
    const db = getDb()
    let groupExpr: string, groupLabel: string
    if (groupBy === 'month') { groupExpr = "strftime('%Y-%m', sale_date)"; groupLabel = 'month' }
    else if (groupBy === 'week') { groupExpr = "strftime('%Y-W%W', sale_date)"; groupLabel = 'week' }
    else { groupExpr = 'sale_date'; groupLabel = 'date' }

    const grouped = db.prepare(`
      SELECT ${groupExpr} as period, COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(amount_paid), 0) as received
      FROM sales WHERE sale_date BETWEEN ? AND ? AND deleted_at IS NULL AND status != 'cancelled'
      GROUP BY period ORDER BY period ASC
    `).all(dateFrom, dateTo)

    const byPayment = db.prepare(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
      FROM sales WHERE sale_date BETWEEN ? AND ? AND deleted_at IS NULL AND status != 'cancelled'
      GROUP BY payment_method ORDER BY total DESC
    `).all(dateFrom, dateTo)

    const topProducts = db.prepare(`
      SELECT si.product_name, SUM(si.quantity) as qty, SUM(si.line_total) as revenue
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.deleted_at IS NULL AND s.status != 'cancelled'
      GROUP BY si.product_id ORDER BY revenue DESC LIMIT 10
    `).all(dateFrom, dateTo)

    return { grouped, byPayment, topProducts }
  },

  purchaseReport(dateFrom: string, dateTo: string) {
    const db = getDb()
    const summary = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total,
        COALESCE(SUM(amount_paid), 0) as paid, COALESCE(SUM(amount_due), 0) as due
      FROM purchases WHERE purchase_date BETWEEN ? AND ? AND deleted_at IS NULL
    `).get(dateFrom, dateTo)

    const bySupplier = db.prepare(`
      SELECT supplier_name, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
      FROM purchases WHERE purchase_date BETWEEN ? AND ? AND deleted_at IS NULL
      GROUP BY supplier_id ORDER BY total DESC
    `).all(dateFrom, dateTo)

    const list = db.prepare(`
      SELECT id, purchase_number, purchase_date, supplier_name, grand_total, amount_due, status
      FROM purchases WHERE purchase_date BETWEEN ? AND ? AND deleted_at IS NULL
      ORDER BY purchase_date DESC
    `).all(dateFrom, dateTo)

    return { summary, bySupplier, list }
  },

  inventoryReport() {
    const db = getDb()
    const summary = db.prepare(`
      SELECT COUNT(*) as total_products,
        SUM(CASE WHEN track_stock = 1 AND current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN track_stock = 1 AND current_stock > 0 AND current_stock <= min_stock_alert THEN 1 ELSE 0 END) as low_stock,
        COALESCE(SUM(current_stock * buy_price), 0) as stock_value,
        COALESCE(SUM(current_stock * sale_price), 0) as retail_value
      FROM products WHERE deleted_at IS NULL AND is_active = 1
    `).get()

    const byCategory = db.prepare(`
      SELECT c.name as category, COUNT(*) as count,
        COALESCE(SUM(p.current_stock * p.buy_price), 0) as value
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL AND p.is_active = 1
      GROUP BY p.category_id ORDER BY value DESC
    `).all()

    return { summary, byCategory }
  },

  expenseReport(dateFrom: string, dateTo: string) {
    const db = getDb()
    const summary = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE expense_date BETWEEN ? AND ? AND deleted_at IS NULL
    `).get(dateFrom, dateTo)

    const byCategory = db.prepare(`
      SELECT category_name, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE expense_date BETWEEN ? AND ? AND deleted_at IS NULL
      GROUP BY category_name ORDER BY total DESC
    `).all(dateFrom, dateTo)

    const daily = db.prepare(`
      SELECT expense_date as date, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE expense_date BETWEEN ? AND ? AND deleted_at IS NULL
      GROUP BY expense_date ORDER BY expense_date ASC
    `).all(dateFrom, dateTo)

    return { summary, byCategory, daily }
  },

  profitLoss(dateFrom: string, dateTo: string) {
    const db = getDb()

    const revenue = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total FROM sales
      WHERE sale_date BETWEEN ? AND ? AND deleted_at IS NULL AND status != 'cancelled'
    `).get(dateFrom, dateTo) as any

    const cogs = db.prepare(`
      SELECT COALESCE(SUM(si.buy_price * si.quantity), 0) as total
      FROM sale_items si JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN ? AND ? AND s.deleted_at IS NULL AND s.status != 'cancelled'
    `).get(dateFrom, dateTo) as any

    const expenses = db.prepare(`
      SELECT category_name, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE expense_date BETWEEN ? AND ? AND deleted_at IS NULL
      GROUP BY category_name ORDER BY total DESC
    `).all(dateFrom, dateTo)

    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.total, 0)

    const payroll = db.prepare(`
      SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll
      WHERE month BETWEEN ? AND ? AND status = 'paid'
    `).get(dateFrom.substring(0, 7), dateTo.substring(0, 7)) as any

    return {
      revenue: revenue.total,
      cogs: cogs.total,
      grossProfit: revenue.total - cogs.total,
      expenses,
      totalExpenses,
      payroll: payroll.total,
      netProfit: revenue.total - cogs.total - totalExpenses - payroll.total
    }
  },

  customersOutstanding() {
    return getDb().prepare(`
      SELECT id, name, phone, current_balance
      FROM customers WHERE current_balance > 0 AND deleted_at IS NULL AND is_active = 1
      ORDER BY current_balance DESC
    `).all()
  }
}
