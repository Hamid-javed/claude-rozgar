import { getDb } from '../db'

export interface StaffRow {
  id: number; name: string; phone: string | null; email: string | null
  address: string | null; cnic: string | null; designation: string | null
  department: string | null; salary_type: string; salary_amount: number
  join_date: string | null; user_id: number | null; is_active: number
  notes: string | null; photo_path: string | null; created_at: string
}

export interface AttendanceRow {
  id: number; staff_id: number; attendance_date: string; status: string
  check_in: string | null; check_out: string | null; overtime_hours: number
  notes: string | null; staff_name?: string
}

export interface PayrollRow {
  id: number; staff_id: number; month: string; base_salary: number
  days_present: number; days_absent: number; overtime_amount: number
  bonuses: number; deductions: number; advance_deduction: number
  net_salary: number; payment_date: string | null; payment_method: string
  status: string; staff_name?: string
}

export const staffRepo = {
  // Staff CRUD
  list(params: { search?: string; is_active?: number } = {}) {
    const conditions: string[] = ['deleted_at IS NULL']
    const values: unknown[] = []
    if (params.search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR designation LIKE ?)')
      const q = `%${params.search}%`; values.push(q, q, q)
    }
    if (params.is_active !== undefined) { conditions.push('is_active = ?'); values.push(params.is_active) }
    return getDb().prepare(`SELECT * FROM staff WHERE ${conditions.join(' AND ')} ORDER BY name ASC`).all(...values) as StaffRow[]
  },

  get(id: number) {
    return getDb().prepare('SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL').get(id) as StaffRow | undefined
  },

  create(data: Record<string, unknown>) {
    const fields = ['name', 'phone', 'email', 'address', 'cnic', 'designation', 'department', 'salary_type', 'salary_amount', 'join_date', 'user_id', 'is_active', 'notes']
    const present = fields.filter((f) => data[f] !== undefined)
    const placeholders = present.map(() => '?').join(', ')
    const values = present.map((f) => data[f])
    return getDb().prepare(`INSERT INTO staff (${present.join(', ')}) VALUES (${placeholders})`).run(...values)
  },

  update(id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at')
    if (fields.length === 0) return
    const sets = fields.map((f) => `${f} = ?`).join(', ')
    const values = fields.map((f) => data[f])
    return getDb().prepare(`UPDATE staff SET ${sets} WHERE id = ? AND deleted_at IS NULL`).run(...values, id)
  },

  delete(id: number) {
    return getDb().prepare("UPDATE staff SET deleted_at = datetime('now') WHERE id = ?").run(id)
  },

  // Attendance
  getAttendance(params: { date?: string; staff_id?: number; month?: string } = {}) {
    const conditions: string[] = []
    const values: unknown[] = []
    if (params.date) { conditions.push('a.attendance_date = ?'); values.push(params.date) }
    if (params.staff_id) { conditions.push('a.staff_id = ?'); values.push(params.staff_id) }
    if (params.month) { conditions.push('a.attendance_date LIKE ?'); values.push(`${params.month}%`) }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return getDb().prepare(`
      SELECT a.*, s.name as staff_name FROM attendance a
      LEFT JOIN staff s ON a.staff_id = s.id
      ${where} ORDER BY a.attendance_date DESC, s.name ASC
    `).all(...values) as AttendanceRow[]
  },

  markAttendance(data: { staff_id: number; attendance_date: string; status: string; check_in?: string; check_out?: string; overtime_hours?: number; notes?: string; created_by?: number }) {
    const db = getDb()
    // Upsert: delete existing then insert
    db.prepare('DELETE FROM attendance WHERE staff_id = ? AND attendance_date = ?').run(data.staff_id, data.attendance_date)
    return db.prepare(`
      INSERT INTO attendance (staff_id, attendance_date, status, check_in, check_out, overtime_hours, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.staff_id, data.attendance_date, data.status, data.check_in || null, data.check_out || null, data.overtime_hours || 0, data.notes || null, data.created_by || null)
  },

  bulkMarkAttendance(records: { staff_id: number; attendance_date: string; status: string }[], createdBy?: number) {
    const db = getDb()
    const mark = db.transaction(() => {
      for (const r of records) {
        db.prepare('DELETE FROM attendance WHERE staff_id = ? AND attendance_date = ?').run(r.staff_id, r.attendance_date)
        db.prepare('INSERT INTO attendance (staff_id, attendance_date, status, created_by) VALUES (?, ?, ?, ?)').run(r.staff_id, r.attendance_date, r.status, createdBy || null)
      }
    })
    mark()
  },

  // Payroll
  listPayroll(params: { month?: string; staff_id?: number; status?: string } = {}) {
    const conditions: string[] = []
    const values: unknown[] = []
    if (params.month) { conditions.push('p.month = ?'); values.push(params.month) }
    if (params.staff_id) { conditions.push('p.staff_id = ?'); values.push(params.staff_id) }
    if (params.status) { conditions.push('p.status = ?'); values.push(params.status) }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return getDb().prepare(`
      SELECT p.*, s.name as staff_name FROM payroll p
      LEFT JOIN staff s ON p.staff_id = s.id
      ${where} ORDER BY s.name ASC
    `).all(...values) as PayrollRow[]
  },

  generatePayroll(month: string, createdBy?: number) {
    const db = getDb()
    const gen = db.transaction(() => {
      // Check if payroll already exists for this month
      const existing = db.prepare('SELECT COUNT(*) as count FROM payroll WHERE month = ?').get(month) as { count: number }
      if (existing.count > 0) throw new Error(`Payroll already generated for ${month}`)

      const activeStaff = db.prepare('SELECT * FROM staff WHERE is_active = 1 AND deleted_at IS NULL').all() as StaffRow[]

      for (const s of activeStaff) {
        // Count attendance
        const attendance = db.prepare(`
          SELECT status, COUNT(*) as count FROM attendance
          WHERE staff_id = ? AND attendance_date LIKE ?
          GROUP BY status
        `).all(s.id, `${month}%`) as { status: string; count: number }[]

        const present = attendance.find((a) => a.status === 'present')?.count || 0
        const halfDay = attendance.find((a) => a.status === 'half_day')?.count || 0
        const absent = attendance.find((a) => a.status === 'absent')?.count || 0
        const effectiveDays = present + (halfDay * 0.5)

        // Overtime
        const otRow = db.prepare(`
          SELECT COALESCE(SUM(overtime_hours), 0) as total FROM attendance
          WHERE staff_id = ? AND attendance_date LIKE ?
        `).get(s.id, `${month}%`) as { total: number }

        // Get total working days in month (approximate: 26)
        const workingDays = 26
        let netSalary = s.salary_amount

        if (s.salary_type === 'monthly') {
          const perDay = s.salary_amount / workingDays
          netSalary = Math.round(effectiveDays * perDay * 100) / 100
        } else if (s.salary_type === 'daily') {
          netSalary = effectiveDays * s.salary_amount
        }

        const overtimeAmount = Math.round(otRow.total * (s.salary_amount / workingDays / 8) * 1.5 * 100) / 100

        // Pending advances
        const advances = db.prepare(`
          SELECT COALESCE(SUM(amount - recovered_amount), 0) as pending
          FROM staff_advances WHERE staff_id = ? AND status != 'recovered'
        `).get(s.id) as { pending: number }

        const advanceDeduction = Math.min(advances.pending, netSalary * 0.25) // Max 25% deduction

        db.prepare(`
          INSERT INTO payroll (staff_id, month, base_salary, days_present, days_absent, overtime_amount, bonuses, deductions, advance_deduction, net_salary, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'pending', ?)
        `).run(s.id, month, s.salary_amount, present + halfDay, absent, overtimeAmount, advanceDeduction, Math.round((netSalary + overtimeAmount - advanceDeduction) * 100) / 100, createdBy || null)
      }
    })
    gen()
  },

  payPayroll(id: number, paymentMethod: string) {
    const db = getDb()
    return db.prepare("UPDATE payroll SET status = 'paid', payment_date = date('now'), payment_method = ? WHERE id = ?").run(paymentMethod, id)
  },

  // Advances
  listAdvances(staffId: number) {
    return getDb().prepare('SELECT * FROM staff_advances WHERE staff_id = ? ORDER BY advance_date DESC').all(staffId)
  },

  createAdvance(data: { staff_id: number; advance_date: string; amount: number; reason?: string; created_by?: number }) {
    return getDb().prepare('INSERT INTO staff_advances (staff_id, advance_date, amount, reason, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(data.staff_id, data.advance_date, data.amount, data.reason || null, data.created_by || null)
  }
}
