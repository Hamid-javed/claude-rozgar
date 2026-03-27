import Database from 'better-sqlite3'

const defaultSettings: Record<string, string> = {
  theme: 'light',
  language: 'en',
  low_stock_alert: '5',
  expiry_alert_days: '30',
  default_tax: '0',
  receipt_printer: 'a4',
  receipt_paper_size: '80mm',
  show_tax_on_receipt: '1',
  auto_print_after_sale: '0',
  auto_backup: '0',
  backup_path: '',
  backup_frequency: 'daily'
}

export function seedSettings(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }
  if (count.count > 0) return

  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
  const insertMany = db.transaction(() => {
    for (const [key, value] of Object.entries(defaultSettings)) {
      insert.run(key, value)
    }
  })
  insertMany()
}
