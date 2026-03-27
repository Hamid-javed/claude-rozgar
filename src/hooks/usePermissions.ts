import { useAuthStore } from '@/store/authStore'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['*'],
  manager: [
    'sales.create', 'sales.edit', 'sales.view',
    'purchases.create', 'purchases.edit', 'purchases.view',
    'inventory.create', 'inventory.edit', 'inventory.view',
    'expenses.create', 'expenses.edit', 'expenses.view',
    'staff.manage', 'payroll.manage', 'attendance.manage',
    'customers.manage', 'suppliers.manage',
    'reports.view', 'reports.export',
    'discounts.manage', 'backup.manage'
  ],
  cashier: [
    'sales.create', 'sales.view',
    'expenses.create',
    'customers.manage'
  ],
  staff: [
    'sales.view',
    'attendance.manage'
  ]
}

export function usePermissions() {
  const { user } = useAuthStore()

  const can = (permission: string): boolean => {
    if (!user) return false

    // Check user-level permission overrides
    if (user.permissions?.[permission] !== undefined) {
      return user.permissions[permission]
    }

    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[user.role] || []
    if (rolePerms.includes('*')) return true
    return rolePerms.includes(permission)
  }

  const isOwner = user?.role === 'owner'
  const isManager = user?.role === 'manager'

  return { can, isOwner, isManager, user }
}
