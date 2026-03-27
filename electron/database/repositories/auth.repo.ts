import { getDb } from '../db'
import bcrypt from 'bcryptjs'

export const authRepo = {
  login(username: string, password: string) {
    const user = getDb().prepare(
      'SELECT * FROM users WHERE username = ? AND is_active = 1 AND deleted_at IS NULL'
    ).get(username) as { id: number; name: string; username: string; password_hash: string; role: string; permissions: string } | undefined

    if (!user) return null
    if (!bcrypt.compareSync(password, user.password_hash)) return null

    // Update last login
    getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id)

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: JSON.parse(user.permissions || '{}')
    }
  },

  createUser(data: { name: string; username: string; password: string; role: string; permissions?: string }) {
    const hash = bcrypt.hashSync(data.password, 10)
    const stmt = getDb().prepare(
      'INSERT INTO users (name, username, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)'
    )
    return stmt.run(data.name, data.username, hash, data.role, data.permissions || '{}')
  },

  getUsers() {
    return getDb().prepare(
      'SELECT id, name, username, role, permissions, is_active, last_login, created_at FROM users WHERE deleted_at IS NULL'
    ).all()
  },

  updateUser(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data)
    if (fields.includes('password')) {
      data.password_hash = bcrypt.hashSync(data.password as string, 10)
      delete data.password
    }
    const actualFields = Object.keys(data)
    const sets = actualFields.map((f) => `${f} = ?`).join(', ')
    const values = actualFields.map((f) => data[f])
    return getDb().prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...values, id)
  },

  deleteUser(id: number) {
    return getDb().prepare("UPDATE users SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  changePassword(id: number, newPassword: string) {
    const hash = bcrypt.hashSync(newPassword, 10)
    return getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id)
  },

  userExists() {
    const row = getDb().prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL').get() as { count: number }
    return row.count > 0
  }
}
