import { cn } from '@/utils/cn'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-surface-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-txt-secondary hover:text-txt-primary hover:border-gray-300'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-2 px-1.5 py-0.5 text-xs rounded-full',
              activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-txt-muted'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
