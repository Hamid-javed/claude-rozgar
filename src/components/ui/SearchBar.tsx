import { useRef, useEffect, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Search } from 'lucide-react'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  shortcut?: string
  onSearch?: (value: string) => void
}

export function SearchBar({ className, shortcut = 'Ctrl+K', onSearch, onChange, ...props }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-lg border border-surface-border bg-white pl-10 pr-16 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        onChange={(e) => {
          onChange?.(e)
          onSearch?.(e.target.value)
        }}
        {...props}
      />
      {shortcut && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-txt-muted bg-gray-100 px-1.5 py-0.5 rounded border border-surface-border font-mono">
          {shortcut}
        </kbd>
      )}
    </div>
  )
}
