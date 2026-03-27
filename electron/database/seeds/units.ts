import Database from 'better-sqlite3'

const defaultUnits = [
  { name: 'Piece', abbreviation: 'pcs' },
  { name: 'Kilogram', abbreviation: 'kg' },
  { name: 'Gram', abbreviation: 'g' },
  { name: 'Liter', abbreviation: 'L' },
  { name: 'Milliliter', abbreviation: 'ml' },
  { name: 'Box', abbreviation: 'box' },
  { name: 'Packet', abbreviation: 'pkt' },
  { name: 'Dozen', abbreviation: 'dz' },
  { name: 'Pair', abbreviation: 'pr' },
  { name: 'Meter', abbreviation: 'm' },
  { name: 'Carton', abbreviation: 'ctn' },
  { name: 'Bottle', abbreviation: 'btl' },
  { name: 'Strip', abbreviation: 'strip' },
  { name: 'Tablet', abbreviation: 'tab' },
  { name: 'Capsule', abbreviation: 'cap' }
]

export function seedUnits(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM units').get() as { count: number }
  if (count.count > 0) return

  const insert = db.prepare('INSERT INTO units (name, abbreviation) VALUES (?, ?)')
  const insertMany = db.transaction(() => {
    for (const unit of defaultUnits) {
      insert.run(unit.name, unit.abbreviation)
    }
  })
  insertMany()
}
