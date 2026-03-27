import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button, Input } from '@/components/ui'
import { StatCard } from '@/components/ui/StatCard'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { DollarSign, ShoppingBag, Receipt, TrendingUp, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FinancialSummary() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const c = profile?.currency_symbol || 'Rs.'

  const now = new Date()
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(firstOfMonth)
  const [dateTo, setDateTo] = useState(today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.invoke('reports:financial-summary', { dateFrom, dateTo }).then((r: any) => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }, [dateFrom, dateTo])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Financial Summary" subtitle="Overview of business performance"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />

      <Card>
        <div className="flex items-center gap-3">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" label="From" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" label="To" />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Sales" value={formatCurrency(data.sales.total, c)} icon={<DollarSign className="w-5 h-5" />}
              accentColor="#2563EB" iconBgClass="bg-blue-50" iconColorClass="text-blue-600"
              trend={{ value: data.sales.count, label: 'transactions' }} />
            <StatCard title="Total Purchases" value={formatCurrency(data.purchases.total, c)} icon={<ShoppingBag className="w-5 h-5" />}
              accentColor="#EA580C" iconBgClass="bg-orange-50" iconColorClass="text-orange-600" />
            <StatCard title="Total Expenses" value={formatCurrency(data.expenses.total, c)} icon={<Receipt className="w-5 h-5" />}
              accentColor="#D97706" iconBgClass="bg-amber-50" iconColorClass="text-amber-600" />
            <StatCard title="Net Profit" value={formatCurrency(data.netProfit, c)} icon={<TrendingUp className="w-5 h-5" />}
              accentColor={data.netProfit >= 0 ? '#16A34A' : '#DC2626'}
              iconBgClass={data.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}
              iconColorClass={data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Revenue Breakdown" />
              <div className="space-y-3 text-sm">
                <Row label="Sales Revenue" value={formatCurrency(data.sales.total, c)} />
                <Row label="Less: Cost of Goods" value={`-${formatCurrency(data.sales.total - data.grossProfit, c)}`} className="text-danger" />
                <div className="border-t border-surface-border pt-2">
                  <Row label="Gross Profit" value={formatCurrency(data.grossProfit, c)} className="font-semibold text-success" />
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Deductions" />
              <div className="space-y-3 text-sm">
                <Row label="Operating Expenses" value={formatCurrency(data.expenses.total, c)} className="text-danger" />
                <Row label="Payroll" value={formatCurrency(data.payroll, c)} className="text-danger" />
                <div className="border-t border-surface-border pt-2">
                  <Row label="Net Profit" value={formatCurrency(data.netProfit, c)} className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`} />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Receivables" />
              <div className="space-y-2 text-sm">
                <Row label="Total Invoiced" value={formatCurrency(data.sales.total, c)} />
                <Row label="Received" value={formatCurrency(data.sales.received, c)} className="text-success" />
                <Row label="Outstanding" value={formatCurrency(data.sales.receivable, c)} className="text-danger font-semibold" />
              </div>
            </Card>
            <Card>
              <CardHeader title="Payables" />
              <div className="space-y-2 text-sm">
                <Row label="Total Purchases" value={formatCurrency(data.purchases.total, c)} />
                <Row label="Paid" value={formatCurrency(data.purchases.paid, c)} className="text-success" />
                <Row label="Outstanding" value={formatCurrency(data.purchases.payable, c)} className="text-danger font-semibold" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return <div className={`flex justify-between ${className || 'text-txt-secondary'}`}><span>{label}</span><span className="font-mono">{value}</span></div>
}
