import { getDb } from '../db'

// ===== TABLES =====
export interface TableRow {
  id: number; table_number: string; capacity: number; area: string | null
  status: string; current_order_id: number | null; notes: string | null
}

export const tablesRepo = {
  list() {
    return getDb().prepare('SELECT * FROM tables ORDER BY table_number ASC').all() as TableRow[]
  },

  create(data: { table_number: string; capacity?: number; area?: string; notes?: string }) {
    return getDb().prepare('INSERT INTO tables (table_number, capacity, area, notes) VALUES (?, ?, ?, ?)')
      .run(data.table_number, data.capacity || 4, data.area || null, data.notes || null)
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data)
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE tables SET ${sets} WHERE id = ?`).run(...values, id)
  },

  updateStatus(id: number, status: string, orderId?: number | null) {
    return getDb().prepare('UPDATE tables SET status = ?, current_order_id = ? WHERE id = ?')
      .run(status, orderId ?? null, id)
  },

  delete(id: number) {
    return getDb().prepare('DELETE FROM tables WHERE id = ?').run(id)
  }
}

// ===== RECIPES =====
export interface RecipeRow {
  id: number; product_id: number | null; name: string; serves: number
  preparation_time: number | null; instructions: string | null; created_at: string
  product_name?: string
}

export interface RecipeIngredientRow {
  id: number; recipe_id: number; ingredient_id: number; quantity: number
  unit_id: number | null; notes: string | null
  ingredient_name?: string; unit_name?: string; buy_price?: number
}

export const recipesRepo = {
  list() {
    return getDb().prepare(`
      SELECT r.*, p.name as product_name
      FROM recipes r LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.name ASC
    `).all() as RecipeRow[]
  },

  get(id: number) {
    const recipe = getDb().prepare(`
      SELECT r.*, p.name as product_name
      FROM recipes r LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `).get(id) as RecipeRow | undefined
    if (!recipe) return null

    const ingredients = getDb().prepare(`
      SELECT ri.*, p.name as ingredient_name, p.buy_price, u.name as unit_name
      FROM recipe_ingredients ri
      LEFT JOIN products p ON ri.ingredient_id = p.id
      LEFT JOIN units u ON ri.unit_id = u.id
      WHERE ri.recipe_id = ?
    `).all(id) as RecipeIngredientRow[]

    return { ...recipe, ingredients }
  },

  create(data: {
    product_id?: number | null; name: string; serves?: number
    preparation_time?: number; instructions?: string
    ingredients?: { ingredient_id: number; quantity: number; unit_id?: number; notes?: string }[]
  }) {
    const db = getDb()
    const createRecipe = db.transaction(() => {
      const result = db.prepare('INSERT INTO recipes (product_id, name, serves, preparation_time, instructions) VALUES (?, ?, ?, ?, ?)')
        .run(data.product_id || null, data.name, data.serves || 1, data.preparation_time || null, data.instructions || null)
      const recipeId = result.lastInsertRowid as number

      if (data.ingredients) {
        const insert = db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, notes) VALUES (?, ?, ?, ?, ?)')
        for (const ing of data.ingredients) {
          insert.run(recipeId, ing.ingredient_id, ing.quantity, ing.unit_id || null, ing.notes || null)
        }
      }
      return recipeId
    })
    return createRecipe()
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = ['name', 'product_id', 'serves', 'preparation_time', 'instructions'].filter((f) => data[f] !== undefined)
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE recipes SET ${sets} WHERE id = ?`).run(...values, id)
  },

  updateIngredients(recipeId: number, ingredients: { ingredient_id: number; quantity: number; unit_id?: number; notes?: string }[]) {
    const db = getDb()
    const update = db.transaction(() => {
      db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(recipeId)
      const insert = db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, notes) VALUES (?, ?, ?, ?, ?)')
      for (const ing of ingredients) {
        insert.run(recipeId, ing.ingredient_id, ing.quantity, ing.unit_id || null, ing.notes || null)
      }
    })
    update()
  },

  delete(id: number) {
    const db = getDb()
    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id)
    return db.prepare('DELETE FROM recipes WHERE id = ?').run(id)
  },

  calculateCost(id: number) {
    const ingredients = getDb().prepare(`
      SELECT ri.quantity, p.buy_price
      FROM recipe_ingredients ri
      LEFT JOIN products p ON ri.ingredient_id = p.id
      WHERE ri.recipe_id = ?
    `).all(id) as { quantity: number; buy_price: number }[]

    return ingredients.reduce((sum, i) => sum + (i.quantity * (i.buy_price || 0)), 0)
  }
}
