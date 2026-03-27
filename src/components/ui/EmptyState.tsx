import { cn } from '@/utils/cn'
import { Button } from './Button'
import { PackageOpen } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, actionLabel, onAction, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="p-4 rounded-full bg-gray-100 text-txt-muted mb-4">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-heading font-semibold text-txt-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-txt-secondary max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
