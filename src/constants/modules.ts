export const ALL_MODULES = [
  'dashboard', 'pos', 'sales', 'purchases', 'inventory',
  'expenses', 'staff', 'invoices', 'reports', 'customers',
  'suppliers', 'recipes', 'prescriptions', 'routes',
  'tables', 'discounts', 'loyalty', 'barcode_scanner',
  'settings', 'backup'
] as const

export type ModuleKey = (typeof ALL_MODULES)[number]

export interface BusinessTypePreset {
  key: string
  label: string
  icon: string
  description: string
  modules: string[]
  customLabels: Record<string, string>
}

export const BUSINESS_PRESETS: BusinessTypePreset[] = [
  {
    key: 'restaurant',
    label: 'Restaurant / Cafe',
    icon: 'UtensilsCrossed',
    description: 'Dine-in, takeaway, table management, recipe costing',
    modules: ['dashboard', 'pos', 'sales', 'inventory', 'expenses', 'staff', 'invoices', 'reports', 'recipes', 'tables', 'customers', 'discounts', 'settings', 'backup'],
    customLabels: { 'Products': 'Menu Items', 'Stock': 'Ingredients', 'Purchase': 'Restock' }
  },
  {
    key: 'general_store',
    label: 'General Store / Grocery',
    icon: 'ShoppingCart',
    description: 'Barcode scanning, credit tracking, bulk purchases',
    modules: ['dashboard', 'pos', 'sales', 'purchases', 'inventory', 'expenses', 'staff', 'invoices', 'reports', 'customers', 'suppliers', 'discounts', 'barcode_scanner', 'settings', 'backup'],
    customLabels: {}
  },
  {
    key: 'medical',
    label: 'Medical / Pharmacy',
    icon: 'Pill',
    description: 'Expiry tracking, batch management, prescriptions',
    modules: ['dashboard', 'pos', 'sales', 'purchases', 'inventory', 'expenses', 'staff', 'invoices', 'reports', 'customers', 'suppliers', 'prescriptions', 'barcode_scanner', 'discounts', 'settings', 'backup'],
    customLabels: { 'Products': 'Medicines', 'Stock': 'Medicines Stock', 'Supplier': 'Pharma Company' }
  },
  {
    key: 'supply',
    label: 'Supply / Distribution',
    icon: 'Truck',
    description: 'Route management, delivery notes, bulk sales',
    modules: ['dashboard', 'sales', 'purchases', 'inventory', 'expenses', 'staff', 'invoices', 'reports', 'customers', 'suppliers', 'routes', 'discounts', 'settings', 'backup'],
    customLabels: { 'Products': 'Goods', 'Customer': 'Retailer' }
  },
  {
    key: 'clothing',
    label: 'Clothing / Retail',
    icon: 'Shirt',
    description: 'Size variants, returns management, loyalty points',
    modules: ['dashboard', 'pos', 'sales', 'purchases', 'inventory', 'expenses', 'staff', 'invoices', 'reports', 'customers', 'suppliers', 'discounts', 'barcode_scanner', 'loyalty', 'settings', 'backup'],
    customLabels: { 'Stock': 'Stock Units', 'Supplier': 'Vendor' }
  },
  {
    key: 'electronics',
    label: 'Electronics Store',
    icon: 'Monitor',
    description: 'Serial tracking, warranty, barcode scanning',
    modules: ['dashboard', 'pos', 'sales', 'purchases', 'inventory', 'expenses', 'staff', 'invoices', 'reports', 'customers', 'suppliers', 'discounts', 'barcode_scanner', 'settings', 'backup'],
    customLabels: { 'Product': 'Item/Device' }
  },
  {
    key: 'custom',
    label: 'Custom Business',
    icon: 'Settings',
    description: 'Choose your own modules and labels',
    modules: ['dashboard', 'sales', 'inventory', 'expenses', 'reports', 'settings', 'backup'],
    customLabels: {}
  }
]

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pos: 'Point of Sale (POS)',
  sales: 'Sales Management',
  purchases: 'Purchase Management',
  inventory: 'Inventory',
  expenses: 'Expenses',
  staff: 'Staff & Payroll',
  invoices: 'Invoices',
  reports: 'Reports',
  customers: 'Customers',
  suppliers: 'Suppliers',
  recipes: 'Recipes (Restaurant)',
  prescriptions: 'Prescriptions (Pharmacy)',
  routes: 'Routes (Supply)',
  tables: 'Table Management',
  discounts: 'Discounts & Offers',
  loyalty: 'Loyalty Program',
  barcode_scanner: 'Barcode Scanner',
  settings: 'Settings',
  backup: 'Backup & Restore'
}
