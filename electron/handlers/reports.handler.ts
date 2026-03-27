import { ipcMain } from 'electron'
import { reportsRepo } from '../database/repositories/reports.repo'

export function registerReportHandlers(): void {
  ipcMain.handle('reports:financial-summary', (_event, { dateFrom, dateTo }: { dateFrom: string; dateTo: string }) => {
    try { return { success: true, data: reportsRepo.financialSummary(dateFrom, dateTo) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('reports:sales', (_event, { dateFrom, dateTo, groupBy }: { dateFrom: string; dateTo: string; groupBy?: string }) => {
    try { return { success: true, data: reportsRepo.salesReport(dateFrom, dateTo, groupBy) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('reports:purchases', (_event, { dateFrom, dateTo }: { dateFrom: string; dateTo: string }) => {
    try { return { success: true, data: reportsRepo.purchaseReport(dateFrom, dateTo) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('reports:inventory', () => {
    try { return { success: true, data: reportsRepo.inventoryReport() } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('reports:expenses', (_event, { dateFrom, dateTo }: { dateFrom: string; dateTo: string }) => {
    try { return { success: true, data: reportsRepo.expenseReport(dateFrom, dateTo) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('reports:profit-loss', (_event, { dateFrom, dateTo }: { dateFrom: string; dateTo: string }) => {
    try { return { success: true, data: reportsRepo.profitLoss(dateFrom, dateTo) } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })

  ipcMain.handle('reports:customers-outstanding', () => {
    try { return { success: true, data: reportsRepo.customersOutstanding() } }
    catch (e: unknown) { return { success: false, error: (e as Error).message } }
  })
}
