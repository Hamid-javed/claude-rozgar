import { ipcMain } from 'electron'
import { discountsRepo } from '../database/repositories/discounts.repo'

export function registerDiscountHandlers(): void {
  ipcMain.handle('discounts:list', (_event, params) => {
    try { return { success: true, data: discountsRepo.list(params || {}) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('discounts:get', (_event, { id }: { id: number }) => {
    try { const d = discountsRepo.get(id); return d ? { success: true, data: d } : { success: false, error: 'Not found' } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('discounts:create', (_event, data) => {
    try { return { success: true, id: discountsRepo.create(data).lastInsertRowid } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('discounts:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try { discountsRepo.update(id, data); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('discounts:delete', (_event, { id }: { id: number }) => {
    try { discountsRepo.delete(id); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('discounts:apply', (_event, { subtotal, customerType }: { subtotal: number; customerType?: string }) => {
    try { return { success: true, data: discountsRepo.getApplicable(subtotal, customerType) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
