import { ipcMain } from 'electron'
import { customersRepo } from '../database/repositories/customers.repo'

export function registerCustomerHandlers(): void {
  ipcMain.handle('customers:list', (_event, params) => {
    try { return { success: true, data: customersRepo.list(params || {}) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:get', (_event, { id }: { id: number }) => {
    try {
      const data = customersRepo.get(id)
      if (!data) return { success: false, error: 'Customer not found' }
      return { success: true, data }
    } catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:create', (_event, data) => {
    try { return { success: true, id: customersRepo.create(data).lastInsertRowid } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try { customersRepo.update(id, data); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:delete', (_event, { id }: { id: number }) => {
    try { customersRepo.delete(id); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:ledger', (_event, { id, dateFrom, dateTo }: { id: number; dateFrom?: string; dateTo?: string }) => {
    try { return { success: true, data: customersRepo.getLedger(id, dateFrom, dateTo) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:receive-payment', (_event, data) => {
    try { return { success: true, ...customersRepo.receivePayment(data) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('customers:outstanding', () => {
    try { return { success: true, data: customersRepo.getOutstanding() } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
