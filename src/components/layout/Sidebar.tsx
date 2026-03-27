import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useProfileStore } from '@/store/profileStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import {
  LayoutDashboard, ShoppingCart, Receipt, ShoppingBag,
  Package, Wallet, Users, FileText, BarChart3,
  Tag, Settings, LogOut, ChevronLeft, ChevronRight,
  UserCircle, Truck, UtensilsCrossed, ClipboardList,
  MapPin, ScanBarcode, Database
} from 'lucide-react'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
}

const moduleNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
  { key: 'pos', label: 'Point of Sale', icon: <ShoppingCart className="w-5 h-5" />, path: '/pos' },
  { key: 'sales', label: 'Sales', icon: <Receipt className="w-5 h-5" />, path: '/sales' },
  { key: 'purchases', label: 'Purchases', icon: <ShoppingBag className="w-5 h-5" />, path: '/purchases' },
  { key: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" />, path: '/inventory' },
  { key: 'expenses', label: 'Expenses', icon: <Wallet className="w-5 h-5" />, path: '/expenses' },
  { key: 'staff', label: 'Staff', icon: <Users className="w-5 h-5" />, path: '/staff' },
  { key: 'customers', label: 'Customers', icon: <UserCircle className="w-5 h-5" />, path: '/customers' },
  { key: 'suppliers', label: 'Suppliers', icon: <Truck className="w-5 h-5" />, path: '/suppliers' },
  { key: 'invoices', label: 'Invoices', icon: <FileText className="w-5 h-5" />, path: '/invoices' },
  { key: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, path: '/reports' },
  { key: 'discounts', label: 'Discounts', icon: <Tag className="w-5 h-5" />, path: '/discounts' },
  { key: 'barcode_scanner', label: 'Barcode', icon: <ScanBarcode className="w-5 h-5" />, path: '/barcode' },
  { key: 'recipes', label: 'Recipes', icon: <UtensilsCrossed className="w-5 h-5" />, path: '/recipes' },
  { key: 'tables', label: 'Tables', icon: <ClipboardList className="w-5 h-5" />, path: '/tables' },
  { key: 'routes', label: 'Routes', icon: <MapPin className="w-5 h-5" />, path: '/routes' },
  { key: 'prescriptions', label: 'Prescriptions', icon: <FileText className="w-5 h-5" />, path: '/prescriptions' }
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useProfileStore()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  const activeModules = profile?.active_modules || ['dashboard', 'settings']
  const getLabel = (key: string, defaultLabel: string) => {
    return profile?.custom_labels?.[key] || defaultLabel
  }

  const visibleNav = moduleNav.filter((item) => activeModules.includes(item.key))

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar-bg transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0">
          B
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-heading font-bold text-base truncate">
              {profile?.name || 'BizCore'}
            </h1>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {visibleNav.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={sidebarCollapsed ? getLabel(item.label, item.label) : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
              )}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <span className="truncate">{getLabel(item.label, item.label)}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>
        <button
          onClick={() => navigate('/settings/backup')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <Database className="w-5 h-5" />
          {!sidebarCollapsed && <span>Backup</span>}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 border-t border-white/10 pt-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-hover flex items-center justify-center text-sidebar-text flex-shrink-0">
            <UserCircle className="w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-text capitalize">{user?.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-hover transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors mt-1"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
