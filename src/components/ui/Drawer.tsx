import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'md' | 'lg' | 'xl'
  children: ReactNode
  footer?: ReactNode
}

const sizeClasses = {
  md: 'w-[480px]',
  lg: 'w-[640px]',
  xl: 'w-[800px]'
}

export function Drawer({ open, onClose, title, size = 'md', children, footer }: DrawerProps) {
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
      className={cn(
        'fixed inset-0 z-50 flex justify-end',
        'bg-black/40 transition-opacity duration-200'
      )}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className={cn(
          'bg-white h-full flex flex-col shadow-2xl',
          'animate-slide-in-right',
          sizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 h-16 border-b border-surface-border shrink-0">
            <h2 className="text-base font-heading font-semibold text-txt-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-txt-muted hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 h-16 border-t border-surface-border flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
