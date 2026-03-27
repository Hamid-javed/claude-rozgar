import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button, Input } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#D97706', '#2563EB', '#16A34A', '#7C3AED', '#DB2777', '#0891B2', '#EA580C', '#6366F1']

export default function ExpenseReport() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const c = profile?.currency_symbol || 'Rs.'
  const now = new Date()
  const [dateFrom, setDateFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.invoke('reports:expenses', { dateFrom, dateTo }).then((r: any) => { if (r.success) setData(r.data); setLoading(false) })
  }, [dateFrom, dateTo])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Expense Report" subtitle="Expense analysis by category and time"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />
      <Card><div className="flex items-center gap-3">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
      </div></Card>

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : data && (
        <>
          <Card style={{ borderLeft: '4px solid #D97706' } as React.CSSProperties}>
            <p className="text-xs text-txt-muted uppercase tracking-wide">Total Expenses</p>
            <p className="text-2xl font-heading font-bold text-warning mt-1">{formatCurrency(data.summary.total, c)}</p>
            <p className="text-xs text-txt-muted mt-0.5">{data.summary.count} entries</p>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Daily Trend" />
              {data.daily.length > 0 ? (
                <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => formatDate(v, 'dd MMM')} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} /><Tooltip formatter={(v: number) => formatCurrency(v, c)} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                    <Bar dataKey="total" fill="#D97706" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer></div>
              ) : <p className="text-sm text-txt-muted text-center py-10">No data</p>}
            </Card>
            <Card>
              <CardHeader title="By Category" />
              {data.byCategory.length > 0 ? (
                <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={data.byCategory} dataKey="total" nameKey="category_name" cx="50%" cy="50%" outerRadius={90}
                    label={({ category_name, percent }) => `${category_name || 'Other'} ${(percent * 100).toFixed(0)}%`}>
                    {data.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v: number) => formatCurrency(v, c)} /></PieChart>
                </ResponsiveContainer></div>
              ) : <p className="text-sm text-txt-muted text-center py-10">No data</p>}
            </Card>
          </div>

          <Card>
            <CardHeader title="Category Breakdown" />
            <div className="space-y-2">
              {data.byCategory.map((cat: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-medium text-txt-primary">{cat.category_name || 'Uncategorized'}</span>
                    <span className="text-xs text-txt-muted">{cat.count} entries</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">{formatCurrency(cat.total, c)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
