import { PageHeader, Card } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { BarChart3, DollarSign, ShoppingBag, Package, Receipt, TrendingUp, Users } from 'lucide-react'

const reports = [
  { key: 'financial', label: 'Financial Summary', desc: 'Overview of sales, expenses, and profit', icon: <DollarSign className="w-6 h-6" />, color: 'text-blue-600', bg: 'bg-blue-50', path: '/reports/financial' },
  { key: 'sales', label: 'Sales Report', desc: 'Sales trends, top products, payment analysis', icon: <BarChart3 className="w-6 h-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/reports/sales' },
  { key: 'purchases', label: 'Purchase Report', desc: 'Purchase history, supplier analysis', icon: <ShoppingBag className="w-6 h-6" />, color: 'text-orange-600', bg: 'bg-orange-50', path: '/reports/purchases' },
  { key: 'inventory', label: 'Inventory Report', desc: 'Stock value, category breakdown', icon: <Package className="w-6 h-6" />, color: 'text-violet-600', bg: 'bg-violet-50', path: '/reports/inventory' },
  { key: 'expenses', label: 'Expense Report', desc: 'Expense trends, category breakdown', icon: <Receipt className="w-6 h-6" />, color: 'text-amber-600', bg: 'bg-amber-50', path: '/reports/expenses' },
  { key: 'profit', label: 'Profit & Loss', desc: 'Revenue, COGS, expenses, net profit', icon: <TrendingUp className="w-6 h-6" />, color: 'text-green-600', bg: 'bg-green-50', path: '/reports/profit-loss' },
  { key: 'outstanding', label: 'Outstanding Dues', desc: 'Customer balances and receivables', icon: <Users className="w-6 h-6" />, color: 'text-pink-600', bg: 'bg-pink-50', path: '/reports/outstanding' }
]

export default function ReportsHub() {
  const navigate = useNavigate()
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Reports" subtitle="View and export business reports" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <button key={r.key} onClick={() => navigate(r.path)}
            className="text-left bg-white rounded-xl border border-surface-border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className={`w-12 h-12 rounded-xl ${r.bg} ${r.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              {r.icon}
            </div>
            <h3 className="text-sm font-heading font-semibold text-txt-primary mb-0.5">{r.label}</h3>
            <p className="text-xs text-txt-muted">{r.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
