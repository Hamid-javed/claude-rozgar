import { ipcMain } from 'electron'
import { productsRepo } from '../database/repositories/products.repo'
import { categoriesRepo } from '../database/repositories/categories.repo'
import { unitsRepo } from '../database/repositories/units.repo'

export function registerProductHandlers(): void {
  // --- Products ---
  ipcMain.handle('products:list', (_event, params) => {
    try {
      const result = productsRepo.list(params || {})
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:get', (_event, { id }: { id: number }) => {
    try {
      const data = productsRepo.get(id)
      if (!data) return { success: false, error: 'Product not found' }
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:create', (_event, data) => {
    try {
      const result = productsRepo.create(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try {
      productsRepo.update(id, data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:delete', (_event, { id }: { id: number }) => {
    try {
      productsRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:search', (_event, { query, limit }: { query: string; limit?: number }) => {
    try {
      const data = productsRepo.search(query, limit)
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:by-barcode', (_event, { barcode }: { barcode: string }) => {
    try {
      const data = productsRepo.getByBarcode(barcode)
      if (!data) return { success: false, error: 'Product not found' }
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:adjust-stock', (_event, { id, type, quantity, reason, userId }: {
    id: number; type: string; quantity: number; reason: string; userId?: number
  }) => {
    try {
      const result = productsRepo.adjustStock(id, type, quantity, reason, userId)
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:stock-movements', (_event, params) => {
    try {
      const result = productsRepo.getStockMovements(params || {})
      return { success: true, ...result }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:low-stock', (_event, params?: { limit?: number }) => {
    try {
      const data = productsRepo.getLowStockProducts(params?.limit)
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('products:generate-sku', () => {
    try {
      const sku = productsRepo.generateSku()
      return { success: true, sku }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  // --- Categories ---
  ipcMain.handle('categories:list', () => {
    try {
      const data = categoriesRepo.list()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('categories:create', (_event, data) => {
    try {
      const result = categoriesRepo.create(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('categories:update', (_event, { id, data }: { id: number; data: Record<string, unknown> }) => {
    try {
      categoriesRepo.update(id, data)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('categories:delete', (_event, { id }: { id: number }) => {
    try {
      categoriesRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  // --- Units ---
  ipcMain.handle('units:list', () => {
    try {
      const data = unitsRepo.list()
      return { success: true, data }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('units:create', (_event, data) => {
    try {
      const result = unitsRepo.create(data)
      return { success: true, id: result.lastInsertRowid }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('units:delete', (_event, { id }: { id: number }) => {
    try {
      unitsRepo.delete(id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
