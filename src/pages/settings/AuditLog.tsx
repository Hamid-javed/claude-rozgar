import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { PageHeader, Card, Select, Input, DataTable, Badge, EmptyState } from '@/components/ui'
import { History } from 'lucide-react'
import { formatDateTime } from '@/utils/formatters'

interface AuditEntry {
  id: number; user_id: number | null; user_name: string | null; action: string
  entity_type: string | null; entity_id: number | null
  old_value: string | null; new_value: string | null; created_at: string
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = { page: 1 }
    if (entityFilter) params.entity_type = entityFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo

    const r = await window.api.invoke('audit:list', params)
    if (r.success) { setEntries(r.data); setTotal(r.total) }
    setLoading(false)
  }, [entityFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(() => [
    { accessorKey: 'created_at', header: 'Date', cell: ({ getValue }) => <span className="text-xs">{formatDateTime(getValue() as string)}</span> },
    { accessorKey: 'user_name', header: 'User', cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || 'System'}</span> },
    { accessorKey: 'action', header: 'Action', cell: ({ getValue }) => <Badge variant="default">{getValue() as string}</Badge> },
    { accessorKey: 'entity_type', header: 'Entity', cell: ({ getValue }) => <span className="text-sm capitalize">{(getValue() as string) || '—'}</span> },
    { accessorKey: 'entity_id', header: 'ID', cell: ({ getValue }) => getValue() ? <span className="text-xs font-mono">#{getValue() as number}</span> : <span className="text-txt-muted">—</span> },
    {
      id: 'details', header: 'Details',
      cell: ({ row }) => {
        const { old_value, new_value } = row.original
        if (!old_value && !new_value) return <span className="text-txt-muted text-xs">—</span>
        return <span className="text-xs text-txt-secondary truncate max-w-[200px] block">{new_value || old_value}</span>
      }
    }
  ], [])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Audit Log" subtitle={`${total} entries`} />
      <Card>
        <div className="flex items-center gap-3">
          <Select options={[
            { value: '', label: 'All Entities' }, { value: 'sale', label: 'Sales' }, { value: 'purchase', label: 'Purchases' },
            { value: 'product', label: 'Products' }, { value: 'expense', label: 'Expenses' }, { value: 'customer', label: 'Customers' },
            { value: 'supplier', label: 'Suppliers' }, { value: 'staff', label: 'Staff' }, { value: 'user', label: 'Users' }
          ]} value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-40" />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </Card>
      <Card padding={false}>
        {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        : entries.length === 0 ? <div className="py-16"><EmptyState icon={<History className="w-8 h-8" />} title="No audit entries" description="Activity will be logged here as users interact with the system." /></div>
        : <DataTable data={entries} columns={columns} />}
      </Card>
    </div>
  )
}
