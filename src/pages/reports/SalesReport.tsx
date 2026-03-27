import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button, Input, Select } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#0891B2']

export default function SalesReport() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const c = profile?.currency_symbol || 'Rs.'

  const now = new Date()
  const [dateFrom, setDateFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0])
  const [groupBy, setGroupBy] = useState('day')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.invoke('reports:sales', { dateFrom, dateTo, groupBy }).then((r: any) => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }, [dateFrom, dateTo, groupBy])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Sales Report" subtitle="Sales trends and analysis"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />

      <Card>
        <div className="flex items-center gap-3">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
          <Select options={[{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]}
            value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-32" />
        </div>
      </Card>

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Sales Trend" />
              {data.grouped.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.grouped}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => groupBy === 'day' ? formatDate(v, 'dd MMM') : v} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v, c), 'Sales']} contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }} />
                      <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-txt-muted text-center py-10">No sales data for this period</p>}
            </Card>

            <Card>
              <CardHeader title="Payment Methods" />
              {data.byPayment.length > 0 ? (
                <div className="h-[280px] flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byPayment} dataKey="total" nameKey="payment_method" cx="50%" cy="50%" outerRadius={100} label={({ payment_method, percent }) => `${payment_method} ${(percent * 100).toFixed(0)}%`}>
                        {data.byPayment.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v, c)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-txt-muted text-center py-10">No data</p>}
            </Card>
          </div>

          <Card>
            <CardHeader title="Top 10 Products" />
            {data.topProducts.length > 0 ? (
              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-surface-border">
                    <th className="text-left px-4 py-2 text-xs font-medium text-txt-muted uppercase">#</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Product</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Qty Sold</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-txt-muted uppercase">Revenue</th>
                  </tr></thead>
                  <tbody>
                    {data.topProducts.map((p: any, i: number) => (
                      <tr key={i} className="border-b border-surface-border last:border-0">
                        <td className="px-4 py-2.5 text-txt-muted">{i + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-txt-primary">{p.product_name}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{p.qty}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatCurrency(p.revenue, c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-txt-muted text-center py-6">No data</p>}
          </Card>
        </>
      )}
    </div>
  )
}
