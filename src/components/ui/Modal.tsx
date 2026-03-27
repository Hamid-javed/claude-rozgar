import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  children: ReactNode
  footer?: ReactNode
  closeOnOverlay?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  fullscreen: 'max-w-[95vw] max-h-[95vh]'
}

export function Modal({ open, onClose, title, size = 'md', children, footer, closeOnOverlay = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleEsc)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleEsc)
      }
    }
    return () => { document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (closeOnOverlay && e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl w-full flex flex-col',
          sizeClasses[size],
          size === 'fullscreen' ? 'h-[95vh]' : 'max-h-[85vh]'
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
            <h2 className="text-lg font-heading font-semibold text-txt-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-txt-muted hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-surface-border flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
