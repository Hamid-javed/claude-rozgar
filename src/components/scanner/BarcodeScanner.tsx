import { useEffect, useRef, useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { Camera, XCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export function BarcodeScanner({ open, onClose, onScan }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const scannerInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!open || !scannerRef.current) return

    let mounted = true

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted) return

        const scanner = new Html5Qrcode('barcode-reader')
        scannerInstanceRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
            onClose()
          },
          () => {} // ignore scan failures
        )
      } catch (err) {
        if (mounted) setError('Camera access denied or not available')
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {})
        scannerInstanceRef.current = null
      }
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Scan Barcode" size="md">
      <div className="space-y-4">
        {error ? (
          <div className="flex flex-col items-center py-8 text-center">
            <XCircle className="w-10 h-10 text-danger mb-3" />
            <p className="text-sm text-danger">{error}</p>
            <p className="text-xs text-txt-muted mt-1">Make sure camera permissions are allowed</p>
          </div>
        ) : (
          <>
            <div id="barcode-reader" ref={scannerRef} className="w-full rounded-lg overflow-hidden" />
            <p className="text-xs text-txt-muted text-center">Point your camera at a barcode</p>
          </>
        )}
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
