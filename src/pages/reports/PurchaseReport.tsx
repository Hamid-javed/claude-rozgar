import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button, Input, Badge } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  received: 'success', partial: 'warning', ordered: 'info', cancelled: 'default'
}

export default function PurchaseReport() {
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
    window.api.invoke('reports:purchases', { dateFrom, dateTo }).then((r: any) => { if (r.success) setData(r.data); setLoading(false) })
  }, [dateFrom, dateTo])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Purchase Report" subtitle="Purchase analysis by supplier"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />
      <Card><div className="flex items-center gap-3">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
      </div></Card>

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SumCard label="Total Purchases" value={formatCurrency(data.summary.total, c)} color="text-primary" />
            <SumCard label="Count" value={data.summary.count} color="text-txt-primary" />
            <SumCard label="Paid" value={formatCurrency(data.summary.paid, c)} color="text-success" />
            <SumCard label="Outstanding" value={formatCurrency(data.summary.due, c)} color="text-danger" />
          </div>

          <Card>
            <CardHeader title="By Supplier" />
            {data.bySupplier.length > 0 ? (
              <div className="space-y-2">
                {data.bySupplier.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm font-medium text-txt-primary">{s.supplier_name || 'Unknown'} <span className="text-txt-muted text-xs">({s.count})</span></span>
                    <span className="font-mono text-sm font-semibold">{formatCurrency(s.total, c)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-txt-muted text-center py-6">No data</p>}
          </Card>

          <Card padding={false}>
            <div className="p-5 pb-0"><CardHeader title="Purchase List" /></div>
            {data.list.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-y border-surface-border">
                  <th className="text-left px-5 py-2 text-xs font-medium text-txt-muted uppercase">PO #</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Date</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Supplier</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Total</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Due</th>
                  <th className="text-center px-5 py-2 text-xs font-medium text-txt-muted uppercase">Status</th>
                </tr></thead>
                <tbody>
                  {data.list.map((p: any, i: number) => (
                    <tr key={p.id} className={`border-b border-surface-border last:border-0 ${i % 2 === 1 ? 'bg-surface-app' : ''}`}>
                      <td className="px-5 py-2.5 font-mono text-primary font-medium">{p.purchase_number}</td>
                      <td className="px-3 py-2.5">{formatDate(p.purchase_date)}</td>
                      <td className="px-3 py-2.5">{p.supplier_name || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">{formatCurrency(p.grand_total, c)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-danger">{p.amount_due > 0 ? formatCurrency(p.amount_due, c) : '—'}</td>
                      <td className="px-5 py-2.5 text-center"><Badge variant={statusVariant[p.status] || 'default'}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-sm text-txt-muted text-center py-6">No purchases</p>}
          </Card>
        </>
      )}
    </div>
  )
}

function SumCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return <Card><p className="text-xs text-txt-muted uppercase tracking-wide">{label}</p><p className={`text-xl font-heading font-bold mt-1 ${color}`}>{value}</p></Card>
}
