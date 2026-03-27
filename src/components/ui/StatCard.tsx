import { cn } from '@/utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  accentColor?: string
  iconBgClass?: string
  iconColorClass?: string
  className?: string
}

export function StatCard({
  title, value, icon, trend, accentColor,
  iconBgClass = 'bg-primary-light', iconColorClass = 'text-primary',
  className
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'bg-surface-card rounded-xl border border-surface-border p-5 shadow-sm',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        className
      )}
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-txt-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-heading font-bold text-txt-primary mt-1.5">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgClass, iconColorClass)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
