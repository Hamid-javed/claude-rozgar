import { SearchBar } from '@/components/ui/SearchBar'
import { useTheme } from '@/hooks/useTheme'
import { Moon, Sun } from 'lucide-react'

export function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-14 border-b border-surface-border bg-surface-card flex items-center px-6 gap-4 flex-shrink-0">
      <SearchBar
        placeholder="Search anything..."
        className="max-w-md"
      />
      <div className="flex-1" />
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-txt-secondary hover:bg-gray-100 transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
      </button>
    </header>
  )
}
