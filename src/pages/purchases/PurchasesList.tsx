import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ShoppingBag, Search, Eye, Trash2, Plus } from 'lucide-react'
import { PageHeader, Button, Input, Select, DataTable, Badge, Card, ConfirmDialog, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { PurchaseDetail } from './PurchaseDetail'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Purchase {
  id: number
  purchase_number: string
  purchase_date: string
  supplier_name: string | null
  grand_total: number
  amount_paid: number
  amount_due: number
  status: string
  payment_method: string
  item_count: number
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  received: 'success', partial: 'warning', ordered: 'info', cancelled: 'default'
}

export default function PurchasesList() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const currency = profile?.currency_symbol || 'Rs.'

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPurchases = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = { page: 1, pageSize: 200 }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo

    const result = await window.api.invoke('purchases:list', params)
    if (result.success) { setPurchases(result.data); setTotal(result.total) }
    setLoading(false)
  }, [search, statusFilter, dateFrom, dateTo])

  useEffect(() => { loadPurchases() }, [loadPurchases])
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const r = await window.api.invoke('purchases:delete', { id: deleteId })
    if (r.success) { toast.success('Purchase deleted'); loadPurchases() }
    else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const columns = useMemo<ColumnDef<Purchase, unknown>[]>(() => [
    {
      accessorKey: 'purchase_number', header: 'Purchase #',
      cell: ({ getValue }) => <span className="font-mono text-sm font-medium text-primary">{getValue() as string}</span>
    },
    {
      accessorKey: 'purchase_date', header: 'Date',
      cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string)}</span>
    },
    {
      accessorKey: 'supplier_name', header: 'Supplier',
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span>
    },
    {
      accessorKey: 'item_count', header: 'Items',
      cell: ({ getValue }) => <Badge variant="default">{getValue() as number}</Badge>
    },
    {
      accessorKey: 'grand_total', header: 'Total',
      cell: ({ getValue }) => <span className="font-mono text-sm font-semibold">{formatCurrency(getValue() as number, currency)}</span>
    },
    {
      accessorKey: 'amount_due', header: 'Due',
      cell: ({ getValue }) => {
        const d = getValue() as number
        return d > 0 ? <span className="font-mono text-sm text-danger font-medium">{formatCurrency(d, currency)}</span> : <span className="text-txt-muted text-xs">—</span>
      }
    },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ getValue }) => <Badge variant={statusVariant[(getValue() as string)] || 'default'}>{getValue() as string}</Badge>
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setSelectedId(row.original.id); setDetailOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title={profile?.custom_labels?.['Purchases'] || 'Purchases'}
        subtitle={`${total} total purchases`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/purchases/new')}>New Purchase</Button>}
      />
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1"><Input placeholder="Search by purchase # or supplier..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} leftIcon={<Search className="w-4 h-4" />} /></div>
          <Select options={[{ value: '', label: 'All Status' }, { value: 'received', label: 'Received' }, { value: 'ordered', label: 'Ordered' }, { value: 'partial', label: 'Partial' }, { value: 'cancelled', label: 'Cancelled' }]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36" />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </Card>
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : purchases.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<ShoppingBag className="w-8 h-8" />} title={search ? 'No purchases found' : 'No purchases yet'} description="Record your first purchase to track inventory and supplier payments."
              action={!search ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/purchases/new')}>New Purchase</Button> : undefined} />
          </div>
        ) : (
          <DataTable data={purchases} columns={columns} onRowClick={(row) => { setSelectedId(row.id); setDetailOpen(true) }} />
        )}
      </Card>
      {selectedId && <PurchaseDetail open={detailOpen} purchaseId={selectedId} currency={currency} onClose={() => { setDetailOpen(false); setSelectedId(null) }} />}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Purchase" message="This purchase record will be removed." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
