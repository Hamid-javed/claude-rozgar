import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Button, Badge } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { ArrowLeft, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function OutstandingReport() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const c = profile?.currency_symbol || 'Rs.'
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.invoke('reports:customers-outstanding').then((r: any) => { if (r.success) setData(r.data); setLoading(false) })
  }, [])

  const totalDue = data.reduce((sum: number, d: any) => sum + d.current_balance, 0)

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Outstanding Dues" subtitle="Customers with pending balances"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/reports')}>Back</Button>} />

      <Card style={{ borderLeft: '4px solid #DC2626' } as React.CSSProperties}>
        <p className="text-xs text-txt-muted uppercase tracking-wide">Total Receivable</p>
        <p className="text-2xl font-heading font-bold text-danger mt-1">{formatCurrency(totalDue, c)}</p>
        <p className="text-xs text-txt-muted mt-0.5">{data.length} customers with outstanding balance</p>
      </Card>

      <Card padding={false}>
        {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        : data.length === 0 ? <div className="py-16 text-center"><Users className="w-10 h-10 mx-auto text-txt-muted opacity-40 mb-2" /><p className="text-sm text-txt-muted">No outstanding dues</p></div>
        : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-surface-border">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-txt-muted uppercase">#</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Customer</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Phone</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-txt-muted uppercase">Balance Due</th>
            </tr></thead>
            <tbody>
              {data.map((d: any, i: number) => (
                <tr key={d.id} className={`border-b border-surface-border last:border-0 cursor-pointer hover:bg-primary-light/30 ${i % 2 === 1 ? 'bg-surface-app' : ''}`}
                  onClick={() => navigate('/customers')}>
                  <td className="px-5 py-3 text-txt-muted">{i + 1}</td>
                  <td className="px-3 py-3 font-medium text-txt-primary">{d.name}</td>
                  <td className="px-3 py-3 text-txt-secondary">{d.phone || '—'}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-danger">{formatCurrency(d.current_balance, c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
