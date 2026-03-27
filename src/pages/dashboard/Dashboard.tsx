import { useState, useEffect } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  DollarSign, TrendingDown, TrendingUp, Wallet,
  Plus, ShoppingCart, Receipt, Package, AlertTriangle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useModules } from '@/hooks/useModules'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface TodayStats {
  total_sales: number
  sale_count: number
  total_received: number
  profit: number
}

interface RecentSale {
  id: number
  invoice_number: string
  sale_date: string
  customer_name: string | null
  grand_total: number
  status: string
  payment_method: string
  item_count: number
}

interface LowStockItem {
  id: number
  name: string
  sku: string | null
  current_stock: number
  min_stock_alert: number
  unit_abbreviation: string | null
}

interface RevenuePoint {
  date: string
  total: number
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  paid: 'success', partial: 'warning', credit: 'danger', cancelled: 'default'
}

export default function Dashboard() {
  const { profile } = useProfileStore()
  const { user } = useAuthStore()
  const { isModuleActive } = useModules()
  const navigate = useNavigate()
  const symbol = profile?.currency_symbol || 'Rs.'

  const [stats, setStats] = useState<TodayStats>({ total_sales: 0, sale_count: 0, total_received: 0, profit: 0 })
  const [expenses, setExpenses] = useState({ total: 0, count: 0 })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])

  useEffect(() => {
    const load = async () => {
      const [salesRes, expensesRes, recentRes, lowStockRes, revenueRes] = await Promise.all([
        window.api.invoke('dashboard:today-stats'),
        window.api.invoke('dashboard:today-expenses'),
        window.api.invoke('dashboard:recent-sales', { limit: 10 }),
        window.api.invoke('dashboard:low-stock'),
        window.api.invoke('dashboard:revenue-chart')
      ])

      if (salesRes.success) setStats(salesRes.data)
      if (expensesRes.success) setExpenses(expensesRes.data)
      if (recentRes.success) setRecentSales(recentRes.data)
      if (lowStockRes.success) setLowStock(lowStockRes.data)
      if (revenueRes.success) setRevenueData(revenueRes.data)
    }
    load()
  }, [])

  const cashInHand = stats.total_received - expenses.total

  return (
    <div className="p-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle={profile?.name || 'BizCore'}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.total_sales, symbol)}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="#2563EB"
          iconBgClass="bg-blue-50"
          iconColorClass="text-blue-600"
          trend={stats.sale_count > 0 ? { value: stats.sale_count, label: `sale${stats.sale_count > 1 ? 's' : ''} today` } : undefined}
        />
        <StatCard
          title="Today's Expenses"
          value={formatCurrency(expenses.total, symbol)}
          icon={<TrendingDown className="w-5 h-5" />}
          accentColor="#D97706"
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-600"
        />
        <StatCard
          title="Today's Profit"
          value={formatCurrency(stats.profit, symbol)}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="#16A34A"
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Cash in Hand"
          value={formatCurrency(cashInHand, symbol)}
          icon={<Wallet className="w-5 h-5" />}
          accentColor="#7C3AED"
          iconBgClass="bg-violet-50"
          iconColorClass="text-violet-600"
        />
      </div>

      {/* Chart + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader title="Last 7 Days Revenue" />
          {revenueData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDate(d, 'dd MMM')}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, symbol), 'Revenue']}
                    labelFormatter={(label) => formatDate(label as string)}
                    contentStyle={{
                      borderRadius: 10, border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13
                    }}
                  />
                  <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No data yet" description="Revenue chart will appear once you start making sales." />
          )}
        </Card>

        {/* Quick Actions — 1/3 width */}
        <Card>
          <CardHeader title="Quick Actions" />
          <div className="space-y-2">
            {isModuleActive('pos') && (
              <Button className="w-full justify-start" icon={<ShoppingCart className="w-4 h-4" />} onClick={() => navigate('/pos')}>
                New Sale
              </Button>
            )}
            {isModuleActive('expenses') && (
              <Button variant="secondary" className="w-full justify-start" icon={<Receipt className="w-4 h-4" />} onClick={() => navigate('/expenses')}>
                Add Expense
              </Button>
            )}
            {isModuleActive('purchases') && (
              <Button variant="secondary" className="w-full justify-start" icon={<Package className="w-4 h-4" />} onClick={() => navigate('/purchases')}>
                New Purchase
              </Button>
            )}
            {isModuleActive('inventory') && (
              <Button variant="secondary" className="w-full justify-start" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/inventory')}>
                Add Product
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Sales + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales — 2/3 */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="p-5 pb-0">
            <CardHeader
              title="Recent Sales"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/sales')}>
                  View all
                </Button>
              }
            />
          </div>
          {recentSales.length === 0 ? (
            <div className="pb-5 px-5">
              <EmptyState title="No sales yet" description="Your recent transactions will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-surface-border bg-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-txt-muted uppercase">Invoice</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Customer</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Total</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, i) => (
                    <tr
                      key={sale.id}
                      className={`border-b border-surface-border last:border-0 cursor-pointer hover:bg-primary-light/30 transition-colors ${i % 2 === 1 ? 'bg-surface-app' : ''}`}
                      onClick={() => navigate('/sales')}
                    >
                      <td className="px-5 py-3 font-mono text-primary font-medium">{sale.invoice_number}</td>
                      <td className="px-3 py-3 text-txt-primary">{sale.customer_name || 'Walk-in'}</td>
                      <td className="px-3 py-3 text-right font-mono font-semibold">{formatCurrency(sale.grand_total, symbol)}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant={statusVariant[sale.status] || 'default'}>{sale.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Low Stock — 1/3 */}
        <Card>
          <CardHeader
            title="Low Stock Alerts"
            action={
              lowStock.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
                  View all
                </Button>
              ) : undefined
            }
          />
          {lowStock.length === 0 ? (
            <EmptyState title="All stocked up" description="Products below minimum stock will appear here." />
          ) : (
            <div className="space-y-1">
              {lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/inventory')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-txt-primary truncate">{item.name}</p>
                      {item.sku && <p className="text-xs text-txt-muted font-mono">{item.sku}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-mono font-semibold ${item.current_stock <= 0 ? 'text-danger' : 'text-warning'}`}>
                      {item.current_stock} {item.unit_abbreviation || 'pcs'}
                    </p>
                    <p className="text-xs text-txt-muted">min: {item.min_stock_alert}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
