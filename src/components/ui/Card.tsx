import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
  padding?: boolean
}

export function Card({ className, children, padding = true }: CardProps) {
  return (
    <div className={cn('bg-surface-card rounded-xl border border-surface-border shadow-sm', padding && 'p-5', className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h3 className="text-base font-heading font-semibold text-txt-primary">{title}</h3>
        {subtitle && <p className="text-sm text-txt-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
