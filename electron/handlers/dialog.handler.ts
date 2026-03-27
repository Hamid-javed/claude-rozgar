import { ipcMain, dialog, BrowserWindow } from 'electron'

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:open-file', async (_event, options?: { filters?: Electron.FileFilter[] }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window focused' }
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: options?.filters
    })
    return { success: !result.canceled, path: result.filePaths[0] || null }
  })

  ipcMain.handle('dialog:save-file', async (_event, options?: { defaultPath?: string; filters?: Electron.FileFilter[] }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window focused' }
    const result = await dialog.showSaveDialog(win, {
      defaultPath: options?.defaultPath,
      filters: options?.filters
    })
    return { success: !result.canceled, path: result.filePath || null }
  })

  ipcMain.handle('dialog:open-dir', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window focused' }
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    return { success: !result.canceled, path: result.filePaths[0] || null }
  })
}
