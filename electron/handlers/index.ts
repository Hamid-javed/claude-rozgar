import { registerProfileHandlers } from './profile.handler'
import { registerAuthHandlers } from './auth.handler'
import { registerSettingsHandlers } from './settings.handler'
import { registerDialogHandlers } from './dialog.handler'
import { registerProductHandlers } from './products.handler'
import { registerSalesHandlers } from './sales.handler'
import { registerDashboardHandlers } from './dashboard.handler'
import { registerPurchaseHandlers } from './purchases.handler'
import { registerSupplierHandlers } from './suppliers.handler'
import { registerExpenseHandlers } from './expenses.handler'
import { registerCustomerHandlers } from './customers.handler'
import { registerStaffHandlers } from './staff.handler'
import { registerReportHandlers } from './reports.handler'

export function registerAllHandlers(): void {
  registerProfileHandlers()
  registerAuthHandlers()
  registerSettingsHandlers()
  registerDialogHandlers()
  registerProductHandlers()
  registerSalesHandlers()
  registerDashboardHandlers()
  registerPurchaseHandlers()
  registerSupplierHandlers()
  registerExpenseHandlers()
  registerCustomerHandlers()
  registerStaffHandlers()
  registerReportHandlers()
}
