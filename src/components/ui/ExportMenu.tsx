import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from './Button'

interface Props {
  onExportExcel: () => void
  onExportPdf: () => void
}

export function ExportMenu({ onExportExcel, onExportPdf }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => setOpen(!open)}>
        Export
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg border border-surface-border shadow-lg py-1 min-w-[160px] animate-scale-in">
            <button onClick={() => { onExportExcel(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-txt-primary hover:bg-gray-50 transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
            </button>
            <button onClick={() => { onExportPdf(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-txt-primary hover:bg-gray-50 transition-colors">
              <FileText className="w-4 h-4 text-red-600" /> Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
