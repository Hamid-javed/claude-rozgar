export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <aside className="w-60 bg-sidebar-bg text-sidebar-text flex-shrink-0">
        <div className="p-4 font-heading font-bold text-white text-lg">BizCore</div>
      </aside>
      <main className="flex-1 overflow-auto bg-surface-app">
        {children}
      </main>
    </div>
  )
}
