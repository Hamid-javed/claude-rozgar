import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button, Input } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfitLoss() {
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
    window.api.invoke('reports:profit-loss', { dateFrom, dateTo }).then((r: any) => { if (r.success) setData(r.data); setLoading(false) })
  }, [dateFrom, dateTo])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Profit & Loss Statement" subtitle="Income vs expenses breakdown"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />
      <Card><div className="flex items-center gap-3">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
      </div></Card>

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : data && (
        <Card className="max-w-2xl">
          <div className="space-y-1">
            {/* Revenue */}
            <Section title="REVENUE" />
            <Row label="Sales Revenue" value={formatCurrency(data.revenue, c)} bold />

            {/* COGS */}
            <Section title="COST OF GOODS SOLD" />
            <Row label="Cost of Goods Sold" value={`(${formatCurrency(data.cogs, c)})`} className="text-danger" />
            <Divider />
            <Row label="Gross Profit" value={formatCurrency(data.grossProfit, c)} bold className={data.grossProfit >= 0 ? 'text-success' : 'text-danger'} />

            {/* Operating Expenses */}
            <Section title="OPERATING EXPENSES" />
            {data.expenses.map((e: any, i: number) => (
              <Row key={i} label={e.category_name || 'Uncategorized'} value={formatCurrency(e.total, c)} indent />
            ))}
            <Row label="Payroll" value={formatCurrency(data.payroll, c)} indent />
            <Divider />
            <Row label="Total Operating Expenses" value={`(${formatCurrency(data.totalExpenses + data.payroll, c)})`} bold className="text-danger" />

            {/* Net */}
            <div className="border-t-2 border-txt-primary pt-3 mt-4">
              <Row label="NET PROFIT / (LOSS)" value={formatCurrency(data.netProfit, c)} bold
                className={`text-xl ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`} />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function Section({ title }: { title: string }) {
  return <p className="text-xs font-semibold text-txt-muted uppercase tracking-wider pt-4 pb-1">{title}</p>
}
function Row({ label, value, bold, className, indent }: { label: string; value: string; bold?: boolean; className?: string; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${className || 'text-txt-secondary'} ${bold ? 'font-semibold' : ''} ${indent ? 'pl-4' : ''}`}>
      <span>{label}</span><span className="font-mono">{value}</span>
    </div>
  )
}
function Divider() { return <div className="border-t border-surface-border my-1" /> }
