import { ipcMain } from 'electron'
import { tablesRepo, recipesRepo } from '../database/repositories/restaurant.repo'

export function registerRestaurantHandlers(): void {
  // Tables
  ipcMain.handle('tables:list', () => {
    try { return { success: true, data: tablesRepo.list() } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('tables:create', (_event, data) => {
    try { return { success: true, id: tablesRepo.create(data).lastInsertRowid } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('tables:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try { tablesRepo.update(id, data); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('tables:update-status', (_event, { id, status, orderId }: { id: number; status: string; orderId?: number }) => {
    try { tablesRepo.updateStatus(id, status, orderId); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('tables:delete', (_event, { id }: { id: number }) => {
    try { tablesRepo.delete(id); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  // Recipes
  ipcMain.handle('recipes:list', () => {
    try { return { success: true, data: recipesRepo.list() } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('recipes:get', (_event, { id }: { id: number }) => {
    try { const d = recipesRepo.get(id); return d ? { success: true, data: d } : { success: false, error: 'Not found' } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('recipes:create', (_event, data) => {
    try { return { success: true, id: recipesRepo.create(data) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('recipes:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try { recipesRepo.update(id, data); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('recipes:delete', (_event, { id }: { id: number }) => {
    try { recipesRepo.delete(id); return { success: true } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
  ipcMain.handle('recipes:calculate-cost', (_event, { id }: { id: number }) => {
    try { return { success: true, cost: recipesRepo.calculateCost(id) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
