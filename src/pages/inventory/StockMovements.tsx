import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Search } from 'lucide-react'
import { PageHeader, Input, Select, Card, DataTable, Badge, EmptyState } from '@/components/ui'
import { formatDateTime } from '@/utils/formatters'

interface StockMovement {
  id: number
  product_id: number
  product_name: string
  product_sku: string | null
  movement_type: string
  quantity: number
  quantity_before: number
  quantity_after: number
  reference_id: number | null
  reference_type: string | null
  notes: string | null
  user_name: string | null
  created_at: string
}

const typeIcons: Record<string, React.ReactNode> = {
  sale: <ArrowDownCircle className="w-4 h-4 text-danger" />,
  purchase: <ArrowUpCircle className="w-4 h-4 text-success" />,
  adjustment: <RefreshCw className="w-4 h-4 text-info" />,
  opening: <ArrowUpCircle className="w-4 h-4 text-primary" />,
  return: <ArrowUpCircle className="w-4 h-4 text-warning" />,
  damage: <ArrowDownCircle className="w-4 h-4 text-danger" />
}

const typeVariant: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'default'> = {
  sale: 'danger', purchase: 'success', adjustment: 'info',
  opening: 'default', return: 'warning', damage: 'danger'
}

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const loadMovements = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = { page: 1, pageSize: 200 }
    if (typeFilter) params.movement_type = typeFilter

    const result = await window.api.invoke('products:stock-movements', params)
    if (result.success) {
      setMovements(result.data)
      setTotal(result.total)
    }
    setLoading(false)
  }, [typeFilter])

  useEffect(() => { loadMovements() }, [loadMovements])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filtered = useMemo(() => {
    if (!search) return movements
    const q = search.toLowerCase()
    return movements.filter((m) =>
      m.product_name?.toLowerCase().includes(q) ||
      m.product_sku?.toLowerCase().includes(q) ||
      m.notes?.toLowerCase().includes(q)
    )
  }, [movements, search])

  const columns = useMemo<ColumnDef<StockMovement, unknown>[]>(() => [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-xs">{formatDateTime(getValue() as string)}</span>
      )
    },
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-txt-primary">{row.original.product_name}</p>
          {row.original.product_sku && (
            <p className="text-xs text-txt-muted font-mono">{row.original.product_sku}</p>
          )}
        </div>
      )
    },
    {
      accessorKey: 'movement_type',
      header: 'Type',
      cell: ({ getValue }) => {
        const type = getValue() as string
        return (
          <div className="flex items-center gap-1.5">
            {typeIcons[type] || null}
            <Badge variant={typeVariant[type] || 'default'}>{type}</Badge>
          </div>
        )
      }
    },
    {
      accessorKey: 'quantity',
      header: 'Qty Change',
      cell: ({ getValue }) => {
        const qty = getValue() as number
        return (
          <span className={`font-mono text-sm font-semibold ${qty > 0 ? 'text-success' : qty < 0 ? 'text-danger' : ''}`}>
            {qty > 0 ? '+' : ''}{qty}
          </span>
        )
      }
    },
    {
      id: 'stock_change',
      header: 'Stock',
      cell: ({ row }) => (
        <span className="text-xs text-txt-secondary font-mono">
          {row.original.quantity_before} → {row.original.quantity_after}
        </span>
      )
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ getValue }) => (
        <span className="text-xs text-txt-secondary truncate max-w-[200px] block">
          {(getValue() as string) || '—'}
        </span>
      )
    },
    {
      accessorKey: 'user_name',
      header: 'By',
      cell: ({ getValue }) => (
        <span className="text-xs text-txt-muted">{(getValue() as string) || '—'}</span>
      )
    }
  ], [])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Stock Movements" subtitle={`${total} total movements`} />

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by product name, SKU, notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'sale', label: 'Sale' },
              { value: 'purchase', label: 'Purchase' },
              { value: 'adjustment', label: 'Adjustment' },
              { value: 'opening', label: 'Opening' },
              { value: 'return', label: 'Return' },
              { value: 'damage', label: 'Damage' }
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<RefreshCw className="w-8 h-8" />}
              title="No stock movements"
              description="Stock changes from sales, purchases, and adjustments will appear here."
            />
          </div>
        ) : (
          <DataTable data={filtered} columns={columns} />
        )}
      </Card>
    </div>
  )
}
