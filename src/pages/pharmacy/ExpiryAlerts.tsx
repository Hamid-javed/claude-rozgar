import { useState, useEffect, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { PageHeader, Card, DataTable, Badge, Tabs, EmptyState } from '@/components/ui'
import { AlertTriangle, Clock, XCircle, Package } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

interface ExpiryProduct {
  id: number; name: string; sku: string | null; batch_number: string | null
  manufacturer: string | null; expiry_date: string; current_stock: number
  days_until_expiry: number
}

const tabs = [
  { key: '30', label: '30 Days', count: 0 },
  { key: '60', label: '60 Days', count: 0 },
  { key: '90', label: '90 Days', count: 0 },
  { key: 'expired', label: 'Expired', count: 0 }
]

export default function ExpiryAlerts() {
  const [products, setProducts] = useState<ExpiryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('30')

  useEffect(() => {
    setLoading(true)
    // Fetch all within 90 days + expired
    window.api.invoke('pharmacy:expiry-alerts', { days: 90 }).then((r: any) => {
      if (r.success) setProducts(r.data)
      setLoading(false)
    })
  }, [])

  const expired = products.filter((p) => p.days_until_expiry <= 0)
  const within30 = products.filter((p) => p.days_until_expiry > 0 && p.days_until_expiry <= 30)
  const within60 = products.filter((p) => p.days_until_expiry > 30 && p.days_until_expiry <= 60)
  const within90 = products.filter((p) => p.days_until_expiry > 60 && p.days_until_expiry <= 90)

  const filtered = activeTab === 'expired' ? expired
    : activeTab === '30' ? within30
    : activeTab === '60' ? within60
    : within90

  const tabsWithCounts = tabs.map((t) => ({
    ...t,
    count: t.key === 'expired' ? expired.length : t.key === '30' ? within30.length : t.key === '60' ? within60.length : within90.length
  }))

  const columns = useMemo<ColumnDef<ExpiryProduct, unknown>[]>(() => [
    {
      accessorKey: 'name', header: 'Medicine',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-txt-primary">{row.original.name}</p>
          {row.original.sku && <p className="text-xs text-txt-muted font-mono">{row.original.sku}</p>}
        </div>
      )
    },
    { accessorKey: 'batch_number', header: 'Batch', cell: ({ getValue }) => <span className="font-mono text-sm">{(getValue() as string) || '—'}</span> },
    { accessorKey: 'manufacturer', header: 'Manufacturer', cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span> },
    {
      accessorKey: 'expiry_date', header: 'Expiry Date',
      cell: ({ row }) => {
        const d = row.original.days_until_expiry
        return (
          <div>
            <p className="text-sm font-medium">{formatDate(row.original.expiry_date)}</p>
            <p className={`text-xs font-medium ${d <= 0 ? 'text-danger' : d <= 30 ? 'text-warning' : 'text-txt-muted'}`}>
              {d <= 0 ? `Expired ${Math.abs(d)} days ago` : `${d} days left`}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'days_until_expiry', header: 'Status',
      cell: ({ getValue }) => {
        const d = getValue() as number
        if (d <= 0) return <Badge variant="danger">Expired</Badge>
        if (d <= 30) return <Badge variant="warning">Urgent</Badge>
        return <Badge variant="info">Monitor</Badge>
      }
    },
    { accessorKey: 'current_stock', header: 'Stock', cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as number}</span> }
  ], [])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Expiry Alerts" subtitle={`${products.length} products need attention`} />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <SumCard label="Expired" value={expired.length} icon={<XCircle className="w-5 h-5" />} color="text-danger" bg="bg-red-50" />
        <SumCard label="Within 30 Days" value={within30.length} icon={<AlertTriangle className="w-5 h-5" />} color="text-warning" bg="bg-amber-50" />
        <SumCard label="Within 60 Days" value={within60.length} icon={<Clock className="w-5 h-5" />} color="text-info" bg="bg-cyan-50" />
        <SumCard label="Within 90 Days" value={within90.length} icon={<Clock className="w-5 h-5" />} color="text-txt-secondary" bg="bg-gray-50" />
      </div>

      {/* Tabs + Table */}
      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

      <Card padding={false}>
        {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        : filtered.length === 0 ? <div className="py-16"><EmptyState icon={<Package className="w-8 h-8" />} title="No items in this range" /></div>
        : <DataTable data={filtered} columns={columns} />}
      </Card>
    </div>
  )
}

function SumCard({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center`}>{icon}</div>
        <div><p className="text-xs text-txt-muted">{label}</p><p className={`text-xl font-heading font-bold ${color}`}>{value}</p></div>
      </div>
    </Card>
  )
}
