import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useProfileStore } from './store/profileStore'
import Login from './pages/auth/Login'
import SetupWizard from './pages/setup/SetupWizard'
import Dashboard from './pages/dashboard/Dashboard'
import ProductList from './pages/inventory/ProductList'
import StockAdjustment from './pages/inventory/StockAdjustment'
import StockMovements from './pages/inventory/StockMovements'
import LowStockReport from './pages/inventory/LowStockReport'
import POS from './pages/pos/POS'
import SalesList from './pages/sales/SalesList'
import PurchasesList from './pages/purchases/PurchasesList'
import NewPurchase from './pages/purchases/NewPurchase'
import SupplierList from './pages/suppliers/SupplierList'
import ExpenseList from './pages/expenses/ExpenseList'
import CustomerList from './pages/customers/CustomerList'
import ReportsHub from './pages/reports/ReportsHub'
import FinancialSummary from './pages/reports/FinancialSummary'
import SalesReport from './pages/reports/SalesReport'
import PurchaseReport from './pages/reports/PurchaseReport'
import InventoryReport from './pages/reports/InventoryReport'
import ExpenseReport from './pages/reports/ExpenseReport'
import ProfitLoss from './pages/reports/ProfitLoss'
import OutstandingReport from './pages/reports/OutstandingReport'
import StaffList from './pages/staff/StaffList'
import StaffAttendance from './pages/staff/Attendance'
import StaffPayroll from './pages/staff/Payroll'
import MainLayout from './components/layout/MainLayout'
import { ModuleGuard } from './components/layout/ModuleGuard'
import { PageLoader } from './components/ui/LoadingSpinner'
import { EmptyState } from './components/ui/EmptyState'
import { Construction } from 'lucide-react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Placeholder for pages not yet built */
function ComingSoon({ title }: { title: string }) {
  return (
    <EmptyState
      icon={<Construction className="w-8 h-8" />}
      title={`${title} — Coming Soon`}
      description="This module will be built in the next phase."
    />
  )
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { loadProfile, isLoaded } = useProfileStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const init = async () => {
      const profileResult = await window.api.invoke('profile:exists') as { success: boolean; exists: boolean }
      const userResult = await window.api.invoke('auth:user-exists') as { success: boolean; exists: boolean }

      if (!profileResult.exists || !userResult.exists) {
        navigate('/setup', { replace: true })
        setChecking(false)
        return
      }

      await loadProfile()
      setChecking(false)
    }
    init()
  }, [])

  if (checking || !isLoaded) {
    return <PageLoader />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route
        path="/*"
        element={
          <AppInitializer>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<ModuleGuard moduleKey="dashboard"><Dashboard /></ModuleGuard>} />
                        <Route path="/pos" element={<ModuleGuard moduleKey="pos"><POS /></ModuleGuard>} />
                        <Route path="/sales" element={<ModuleGuard moduleKey="sales"><SalesList /></ModuleGuard>} />
                        <Route path="/purchases" element={<ModuleGuard moduleKey="purchases"><PurchasesList /></ModuleGuard>} />
                        <Route path="/purchases/new" element={<ModuleGuard moduleKey="purchases"><NewPurchase /></ModuleGuard>} />
                        <Route path="/inventory" element={<ModuleGuard moduleKey="inventory"><ProductList /></ModuleGuard>} />
                        <Route path="/inventory/adjust" element={<ModuleGuard moduleKey="inventory"><StockAdjustment /></ModuleGuard>} />
                        <Route path="/inventory/movements" element={<ModuleGuard moduleKey="inventory"><StockMovements /></ModuleGuard>} />
                        <Route path="/inventory/low-stock" element={<ModuleGuard moduleKey="inventory"><LowStockReport /></ModuleGuard>} />
                        <Route path="/expenses" element={<ModuleGuard moduleKey="expenses"><ExpenseList /></ModuleGuard>} />
                        <Route path="/staff" element={<ModuleGuard moduleKey="staff"><StaffList /></ModuleGuard>} />
                        <Route path="/staff/attendance" element={<ModuleGuard moduleKey="staff"><StaffAttendance /></ModuleGuard>} />
                        <Route path="/staff/payroll" element={<ModuleGuard moduleKey="staff"><StaffPayroll /></ModuleGuard>} />
                        <Route path="/customers" element={<ModuleGuard moduleKey="customers"><CustomerList /></ModuleGuard>} />
                        <Route path="/suppliers" element={<ModuleGuard moduleKey="suppliers"><SupplierList /></ModuleGuard>} />
                        <Route path="/invoices" element={<ModuleGuard moduleKey="invoices"><ComingSoon title="Invoices" /></ModuleGuard>} />
                        <Route path="/reports" element={<ModuleGuard moduleKey="reports"><ReportsHub /></ModuleGuard>} />
                        <Route path="/reports/financial" element={<ModuleGuard moduleKey="reports"><FinancialSummary /></ModuleGuard>} />
                        <Route path="/reports/sales" element={<ModuleGuard moduleKey="reports"><SalesReport /></ModuleGuard>} />
                        <Route path="/reports/purchases" element={<ModuleGuard moduleKey="reports"><PurchaseReport /></ModuleGuard>} />
                        <Route path="/reports/inventory" element={<ModuleGuard moduleKey="reports"><InventoryReport /></ModuleGuard>} />
                        <Route path="/reports/expenses" element={<ModuleGuard moduleKey="reports"><ExpenseReport /></ModuleGuard>} />
                        <Route path="/reports/profit-loss" element={<ModuleGuard moduleKey="reports"><ProfitLoss /></ModuleGuard>} />
                        <Route path="/reports/outstanding" element={<ModuleGuard moduleKey="reports"><OutstandingReport /></ModuleGuard>} />
                        <Route path="/discounts" element={<ModuleGuard moduleKey="discounts"><ComingSoon title="Discounts" /></ModuleGuard>} />
                        <Route path="/barcode" element={<ModuleGuard moduleKey="barcode_scanner"><ComingSoon title="Barcode Scanner" /></ModuleGuard>} />
                        <Route path="/recipes" element={<ModuleGuard moduleKey="recipes"><ComingSoon title="Recipes" /></ModuleGuard>} />
                        <Route path="/tables" element={<ModuleGuard moduleKey="tables"><ComingSoon title="Table Management" /></ModuleGuard>} />
                        <Route path="/routes" element={<ModuleGuard moduleKey="routes"><ComingSoon title="Routes" /></ModuleGuard>} />
                        <Route path="/prescriptions" element={<ModuleGuard moduleKey="prescriptions"><ComingSoon title="Prescriptions" /></ModuleGuard>} />
                        <Route path="/settings" element={<ComingSoon title="Settings" />} />
                        <Route path="/settings/backup" element={<ComingSoon title="Backup & Restore" />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppInitializer>
        }
      />
    </Routes>
  )
}
