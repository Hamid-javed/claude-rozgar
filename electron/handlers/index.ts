import { registerProfileHandlers } from './profile.handler'
import { registerAuthHandlers } from './auth.handler'
import { registerSettingsHandlers } from './settings.handler'
import { registerDialogHandlers } from './dialog.handler'
import { registerProductHandlers } from './products.handler'
import { registerSalesHandlers } from './sales.handler'
import { registerDashboardHandlers } from './dashboard.handler'
import { registerPurchaseHandlers } from './purchases.handler'
import { registerSupplierHandlers } from './suppliers.handler'

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
}
