import { ipcMain } from 'electron'
import { staffRepo } from '../database/repositories/staff.repo'

export function registerStaffHandlers(): void {
  // Staff CRUD
  ipcMain.handle('staff:list', (_event, params) => {
    try { return { success: true, data: staffRepo.list(params || {}) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('staff:get', (_event, { id }: { id: number }) => {
    try { const d = staffRepo.get(id); return d ? { success: true, data: d } : { success: false, error: 'Not found' } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('staff:create', (_event, data) => {
    try { return { success: true, id: staffRepo.create(data).lastInsertRowid } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('staff:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try { staffRepo.update(id, data); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('staff:delete', (_event, { id }: { id: number }) => {
    try { staffRepo.delete(id); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  // Attendance
  ipcMain.handle('attendance:list', (_event, params) => {
    try { return { success: true, data: staffRepo.getAttendance(params || {}) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('attendance:mark', (_event, data) => {
    try { staffRepo.markAttendance(data); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('attendance:bulk-mark', (_event, { records, createdBy }: { records: any[]; createdBy?: number }) => {
    try { staffRepo.bulkMarkAttendance(records, createdBy); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  // Payroll
  ipcMain.handle('payroll:list', (_event, params) => {
    try { return { success: true, data: staffRepo.listPayroll(params || {}) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('payroll:generate', (_event, { month, createdBy }: { month: string; createdBy?: number }) => {
    try { staffRepo.generatePayroll(month, createdBy); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('payroll:pay', (_event, { id, paymentMethod }: { id: number; paymentMethod: string }) => {
    try { staffRepo.payPayroll(id, paymentMethod); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  // Advances
  ipcMain.handle('staff-advances:list', (_event, { staffId }: { staffId: number }) => {
    try { return { success: true, data: staffRepo.listAdvances(staffId) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('staff-advances:create', (_event, data) => {
    try { return { success: true, id: staffRepo.createAdvance(data).lastInsertRowid } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
