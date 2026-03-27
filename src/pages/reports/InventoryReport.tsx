import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button } from '@/components/ui'
import { StatCard } from '@/components/ui/StatCard'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { ArrowLeft, Package, AlertTriangle, XCircle, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function InventoryReport() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const c = profile?.currency_symbol || 'Rs.'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.invoke('reports:inventory').then((r: any) => { if (r.success) setData(r.data); setLoading(false) })
  }, [])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Inventory Report" subtitle="Stock overview and valuation"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Products" value={formatNumber(data.summary.total_products)} icon={<Package className="w-5 h-5" />}
              accentColor="#7C3AED" iconBgClass="bg-violet-50" iconColorClass="text-violet-600" />
            <StatCard title="Out of Stock" value={formatNumber(data.summary.out_of_stock)} icon={<XCircle className="w-5 h-5" />}
              accentColor="#DC2626" iconBgClass="bg-red-50" iconColorClass="text-red-600" />
            <StatCard title="Low Stock" value={formatNumber(data.summary.low_stock)} icon={<AlertTriangle className="w-5 h-5" />}
              accentColor="#D97706" iconBgClass="bg-amber-50" iconColorClass="text-amber-600" />
            <StatCard title="Stock Value (Cost)" value={formatCurrency(data.summary.stock_value, c)} icon={<DollarSign className="w-5 h-5" />}
              accentColor="#2563EB" iconBgClass="bg-blue-50" iconColorClass="text-blue-600" />
          </div>

          <Card>
            <CardHeader title="Retail Value" />
            <p className="text-3xl font-heading font-bold text-success">{formatCurrency(data.summary.retail_value, c)}</p>
            <p className="text-xs text-txt-muted mt-1">Potential margin: {formatCurrency(data.summary.retail_value - data.summary.stock_value, c)}</p>
          </Card>

          <Card>
            <CardHeader title="Stock Value by Category" />
            {data.byCategory.length > 0 ? (
              <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byCategory} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} width={80} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, c)} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                  <Bar dataKey="value" fill="#7C3AED" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            ) : <p className="text-sm text-txt-muted text-center py-10">No category data</p>}
          </Card>
        </>
      )}
    </div>
  )
}
