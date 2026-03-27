import Database from 'better-sqlite3'

const defaultCategories = [
  { name: 'Fuel', icon: 'Fuel', color: '#EF4444', is_daily: 1 },
  { name: 'Food / Meals', icon: 'UtensilsCrossed', color: '#F97316', is_daily: 1 },
  { name: 'Staff Salaries', icon: 'Users', color: '#8B5CF6', is_daily: 0 },
  { name: 'Rent', icon: 'Home', color: '#6366F1', is_daily: 0 },
  { name: 'Electricity', icon: 'Zap', color: '#EAB308', is_daily: 0 },
  { name: 'Water', icon: 'Droplets', color: '#06B6D4', is_daily: 0 },
  { name: 'Phone / Internet', icon: 'Phone', color: '#10B981', is_daily: 0 },
  { name: 'Maintenance', icon: 'Wrench', color: '#78716C', is_daily: 0 },
  { name: 'Transport', icon: 'Truck', color: '#0EA5E9', is_daily: 1 },
  { name: 'Marketing', icon: 'Megaphone', color: '#EC4899', is_daily: 0 },
  { name: 'Miscellaneous', icon: 'MoreHorizontal', color: '#94A3B8', is_daily: 1 },
  { name: 'Bank Charges', icon: 'Landmark', color: '#64748B', is_daily: 0 }
]

export function seedExpenseCategories(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM expense_categories').get() as { count: number }
  if (count.count > 0) return

  const insert = db.prepare(
    'INSERT INTO expense_categories (name, icon, color, is_daily) VALUES (?, ?, ?, ?)'
  )
  const insertMany = db.transaction(() => {
    for (const cat of defaultCategories) {
      insert.run(cat.name, cat.icon, cat.color, cat.is_daily)
    }
  })
  insertMany()
}
