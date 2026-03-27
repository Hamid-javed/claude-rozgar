import Database from 'better-sqlite3'
import { migrations } from './index'

export function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const executed = db.prepare('SELECT name FROM _migrations').all() as { name: string }[]
  const executedNames = new Set(executed.map((m) => m.name))

  const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)')

  for (const migration of migrations) {
    if (!executedNames.has(migration.name)) {
      const runInTransaction = db.transaction(() => {
        db.exec(migration.sql)
        insertMigration.run(migration.name)
      })
      runInTransaction()
      console.log(`Migration executed: ${migration.name}`)
    }
  }
}
