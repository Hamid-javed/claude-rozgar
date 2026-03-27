import { ipcMain, dialog, app } from 'electron'
import { copyFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { getDbPath, closeDb, initDatabase } from '../database/db'

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:create', async () => {
    try {
      const dbPath = getDbPath()
      if (!existsSync(dbPath)) return { success: false, error: 'Database file not found' }

      const result = await dialog.showSaveDialog({
        title: 'Save Backup',
        defaultPath: `BizCore_Backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      })

      if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' }

      copyFileSync(dbPath, result.filePath)
      return { success: true, path: result.filePath }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('backup:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Backup File',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'Cancelled' }

      const backupPath = result.filePaths[0]
      const dbPath = getDbPath()

      // Create a safety backup of current DB
      const safetyPath = dbPath + '.before-restore'
      if (existsSync(dbPath)) {
        copyFileSync(dbPath, safetyPath)
      }

      // Close current DB, copy backup over, reinitialize
      closeDb()
      copyFileSync(backupPath, dbPath)
      initDatabase()

      return { success: true, restoredFrom: basename(backupPath) }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('backup:auto', (_event, { path }: { path: string }) => {
    try {
      const dbPath = getDbPath()
      if (!existsSync(dbPath)) return { success: false, error: 'Database not found' }

      if (!existsSync(path)) mkdirSync(path, { recursive: true })

      const filename = `BizCore_Auto_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
      const dest = join(path, filename)
      copyFileSync(dbPath, dest)

      return { success: true, path: dest }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('backup:list', (_event, { path }: { path: string }) => {
    try {
      if (!path || !existsSync(path)) return { success: true, data: [] }

      const files = readdirSync(path)
        .filter((f) => f.endsWith('.db') && f.startsWith('BizCore'))
        .map((f) => {
          const fullPath = join(path, f)
          const stats = statSync(fullPath)
          return { name: f, path: fullPath, size: stats.size, date: stats.mtime.toISOString() }
        })
        .sort((a, b) => b.date.localeCompare(a.date))

      return { success: true, data: files }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  })
}
