import { SearchBar } from '@/components/ui/SearchBar'

export function Header() {
  return (
    <header className="h-14 border-b border-surface-border bg-surface-card flex items-center px-6 gap-4 flex-shrink-0">
      <SearchBar
        placeholder="Search anything..."
        className="max-w-md"
      />
    </header>
  )
}
