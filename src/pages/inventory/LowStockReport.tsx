import { useState, useEffect, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, Package, ShoppingBag } from 'lucide-react'
import { PageHeader, DataTable, Badge, Card, EmptyState, Button } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'

interface Product {
  id: number; name: string; sku: string | null; category_name: string | null
  buy_price: number; sale_price: number; current_stock: number
  min_stock_alert: number; unit_abbreviation: string | null
}

export default function LowStockReport() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const currency = profile?.currency_symbol || 'Rs.'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.invoke('products:low-stock', { limit: 100 }).then((r: any) => {
      if (r.success) setProducts(r.data)
      setLoading(false)
    })
  }, [])

  const outOfStock = products.filter((p) => p.current_stock <= 0)
  const lowStock = products.filter((p) => p.current_stock > 0)

  const columns = useMemo<ColumnDef<Product, unknown>[]>(() => [
    {
      accessorKey: 'name', header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${row.original.current_stock <= 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
            <AlertTriangle className={`w-4 h-4 ${row.original.current_stock <= 0 ? 'text-danger' : 'text-warning'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-txt-primary">{row.original.name}</p>
            {row.original.sku && <p className="text-xs text-txt-muted font-mono">{row.original.sku}</p>}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'category_name', header: 'Category',
      cell: ({ getValue }) => getValue() ? <Badge variant="default">{getValue() as string}</Badge> : <span className="text-txt-muted text-xs">—</span>
    },
    {
      accessorKey: 'current_stock', header: 'Current Stock',
      cell: ({ row }) => (
        <span className={`font-mono text-sm font-semibold ${row.original.current_stock <= 0 ? 'text-danger' : 'text-warning'}`}>
          {row.original.current_stock} {row.original.unit_abbreviation || 'pcs'}
        </span>
      )
    },
    {
      accessorKey: 'min_stock_alert', header: 'Min Alert',
      cell: ({ getValue }) => <span className="font-mono text-sm text-txt-muted">{getValue() as number}</span>
    },
    {
      id: 'deficit', header: 'Deficit',
      cell: ({ row }) => {
        const deficit = row.original.min_stock_alert - row.original.current_stock
        return deficit > 0 ? <span className="font-mono text-sm text-danger font-medium">-{deficit}</span> : <span className="text-txt-muted text-xs">—</span>
      }
    },
    {
      accessorKey: 'buy_price', header: 'Restock Cost',
      cell: ({ row }) => {
        const deficit = Math.max(0, row.original.min_stock_alert - row.original.current_stock)
        const cost = deficit * row.original.buy_price
        return cost > 0 ? <span className="font-mono text-sm">{formatCurrency(cost, currency)}</span> : <span className="text-txt-muted text-xs">—</span>
      }
    },
    {
      id: 'action', header: '',
      cell: () => (
        <Button variant="ghost" size="sm" onClick={() => navigate('/purchases/new')}>
          <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Restock
        </Button>
      )
    }
  ], [currency, navigate])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Low Stock Report" subtitle={`${products.length} products need attention`} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Out of Stock" value={outOfStock.length} color="text-danger" bg="bg-red-50" />
        <SummaryCard label="Low Stock" value={lowStock.length} color="text-warning" bg="bg-amber-50" />
        <SummaryCard
          label="Est. Restock Cost"
          value={formatCurrency(
            products.reduce((sum, p) => sum + Math.max(0, p.min_stock_alert - p.current_stock) * p.buy_price, 0),
            currency
          )}
          color="text-primary" bg="bg-primary-light"
          isText
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<Package className="w-8 h-8" />} title="All stocked up!" description="No products are below their minimum stock level." />
          </div>
        ) : (
          <DataTable data={products} columns={columns} />
        )}
      </Card>
    </div>
  )
}

function SummaryCard({ label, value, color, bg, isText }: { label: string; value: number | string; color: string; bg: string; isText?: boolean }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <p className="text-xs text-txt-muted uppercase tracking-wide">{label}</p>
      <p className={`${isText ? 'text-lg' : 'text-2xl'} font-heading font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}
