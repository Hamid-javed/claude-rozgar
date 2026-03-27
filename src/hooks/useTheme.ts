import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bizcore-theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bizcore-theme', theme)
  }, [theme])

  const setTheme = (t: 'light' | 'dark') => setThemeState(t)
  const toggleTheme = () => setThemeState((prev) => prev === 'light' ? 'dark' : 'light')

  return { theme, setTheme, toggleTheme }
}
