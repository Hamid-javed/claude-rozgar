import * as XLSX from 'xlsx'

interface ExportOptions {
  data: Record<string, unknown>[]
  columns: { header: string; key: string; width?: number }[]
  filename: string
  sheetName?: string
}

export async function exportToExcel({ data, columns, filename, sheetName = 'Sheet1' }: ExportOptions): Promise<void> {
  // Map data to rows using column keys
  const rows = data.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col) => {
      obj[col.header] = row[col.key]
    })
    return obj
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Ask user where to save
  const result = await window.api.invoke('dialog:save-file', {
    defaultPath: `${filename}.xlsx`,
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  })

  if (result.filePath) {
    XLSX.writeFile(wb, result.filePath)
    return
  }

  // Fallback: download via blob (won't work in Electron easily, but the dialog should handle it)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
