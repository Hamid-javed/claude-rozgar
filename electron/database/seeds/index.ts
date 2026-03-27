import Database from 'better-sqlite3'
import { seedUnits } from './units'
import { seedExpenseCategories } from './expense_categories'
import { seedSettings } from './settings'

export function runSeeds(db: Database.Database): void {
  seedUnits(db)
  seedExpenseCategories(db)
  seedSettings(db)
}
