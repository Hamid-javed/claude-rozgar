import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Receipt, Search, Eye, Trash2, Plus, Calendar, Filter
} from 'lucide-react'
import {
  PageHeader, Button, Input, Select, DataTable, Badge,
  Card, ConfirmDialog, EmptyState
} from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { SaleDetail } from './SaleDetail'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Sale {
  id: number
  invoice_number: string
  sale_date: string
  customer_name: string | null
  grand_total: number
  amount_paid: number
  amount_due: number
  status: string
  payment_method: string
  item_count: number
  created_at: string
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  paid: 'success',
  partial: 'warning',
  credit: 'danger',
  cancelled: 'default',
  returned: 'info'
}

export default function SalesList() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const currency = profile?.currency_symbol || 'Rs.'

  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Detail drawer
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadSales = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = { page: 1, pageSize: 200 }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo

    const result = await window.api.invoke('sales:list', params)
    if (result.success) {
      setSales(result.data)
      setTotal(result.total)
    }
    setLoading(false)
  }, [search, statusFilter, dateFrom, dateTo])

  useEffect(() => { loadSales() }, [loadSales])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const result = await window.api.invoke('sales:delete', { id: deleteId })
    if (result.success) {
      toast.success('Sale deleted')
      loadSales()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
    setDeleteId(null)
    setDeleting(false)
  }

  const columns = useMemo<ColumnDef<Sale, unknown>[]>(() => [
    {
      accessorKey: 'invoice_number',
      header: 'Invoice',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium text-primary">{getValue() as string}</span>
      )
    },
    {
      accessorKey: 'sale_date',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-sm">{formatDate(getValue() as string)}</span>
      )
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ getValue }) => (
        <span className="text-sm">{(getValue() as string) || 'Walk-in'}</span>
      )
    },
    {
      accessorKey: 'item_count',
      header: 'Items',
      cell: ({ getValue }) => (
        <Badge variant="default">{getValue() as number}</Badge>
      )
    },
    {
      accessorKey: 'grand_total',
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-semibold">{formatCurrency(getValue() as number, currency)}</span>
      )
    },
    {
      accessorKey: 'amount_due',
      header: 'Due',
      cell: ({ getValue }) => {
        const due = getValue() as number
        return due > 0 ? (
          <span className="font-mono text-sm text-danger font-medium">{formatCurrency(due, currency)}</span>
        ) : (
          <span className="text-txt-muted text-xs">—</span>
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as string
        return <Badge variant={statusVariant[s] || 'default'}>{s}</Badge>
      }
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment',
      cell: ({ getValue }) => (
        <span className="text-xs text-txt-secondary capitalize">{(getValue() as string).replace('_', ' ')}</span>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedId(row.original.id); setDetailOpen(true) }}
            className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }}
            className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Sales"
        subtitle={`${total} total sales`}
        actions={
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/pos')}>
            New Sale
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by invoice # or customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'partial', label: 'Partial' },
              { value: 'credit', label: 'Credit' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
            placeholder="To"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Receipt className="w-8 h-8" />}
              title={search ? 'No sales found' : 'No sales yet'}
              description={search ? 'Try a different search' : 'Sales will appear here once you make your first sale from the POS'}
              action={
                !search ? (
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/pos')}>
                    Go to POS
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <DataTable
            data={sales}
            columns={columns}
            onRowClick={(row) => { setSelectedId(row.id); setDetailOpen(true) }}
          />
        )}
      </Card>

      {/* Sale Detail Drawer */}
      {selectedId && (
        <SaleDetail
          open={detailOpen}
          saleId={selectedId}
          currency={currency}
          onClose={() => { setDetailOpen(false); setSelectedId(null) }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Sale"
        message="This sale record will be removed. Stock will NOT be restored."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
