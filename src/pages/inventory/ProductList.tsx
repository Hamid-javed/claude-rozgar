import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Package, Plus, Search, Filter, Edit2, Trash2, BarChart3,
  AlertTriangle, Tag
} from 'lucide-react'
import {
  PageHeader, Button, Input, Select, DataTable, Badge,
  ConfirmDialog, EmptyState, Card
} from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { ProductForm } from './ProductForm'
import { CategoryManager } from './CategoryManager'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  category_id: number | null
  category_name: string | null
  unit_abbreviation: string | null
  buy_price: number
  sale_price: number
  current_stock: number
  min_stock_alert: number
  track_stock: number
  is_active: number
}

interface Category {
  id: number
  name: string
  product_count: number
  color: string | null
}

export default function ProductList() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')

  // Drawers
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = { page: 1, pageSize: 500 }
    if (search) params.search = search
    if (categoryFilter) params.category_id = Number(categoryFilter)
    if (stockFilter === 'low') params.low_stock = true
    if (stockFilter === 'active') params.is_active = 1
    if (stockFilter === 'inactive') params.is_active = 0

    const result = await window.api.invoke('products:list', params)
    if (result.success) {
      setProducts(result.data)
      setTotal(result.total)
    }
    setLoading(false)
  }, [search, categoryFilter, stockFilter])

  const loadCategories = useCallback(async () => {
    const result = await window.api.invoke('categories:list')
    if (result.success) setCategories(result.data)
  }, [])

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const result = await window.api.invoke('products:delete', { id: deleteId })
    if (result.success) {
      toast.success('Product deleted')
      loadProducts()
      loadCategories()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
    setDeleteId(null)
    setDeleting(false)
  }

  const handleFormClose = (saved?: boolean) => {
    setFormOpen(false)
    setEditingId(null)
    if (saved) {
      loadProducts()
      loadCategories()
    }
  }

  const columns = useMemo<ColumnDef<Product, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-txt-primary text-sm">{row.original.name}</p>
            {row.original.sku && (
              <p className="text-xs text-txt-muted font-mono">{row.original.sku}</p>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        return val ? (
          <Badge variant="default">{val}</Badge>
        ) : (
          <span className="text-txt-muted text-xs">—</span>
        )
      }
    },
    {
      accessorKey: 'buy_price',
      header: 'Buy Price',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{formatCurrency(getValue() as number, currency)}</span>
      )
    },
    {
      accessorKey: 'sale_price',
      header: 'Sale Price',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium">{formatCurrency(getValue() as number, currency)}</span>
      )
    },
    {
      accessorKey: 'current_stock',
      header: 'Stock',
      cell: ({ row }) => {
        const { current_stock, min_stock_alert, track_stock, unit_abbreviation } = row.original
        if (!track_stock) return <span className="text-txt-muted text-xs">N/A</span>
        const isLow = current_stock <= min_stock_alert
        return (
          <div className="flex items-center gap-1.5">
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
            <span className={isLow ? 'text-warning font-medium' : ''}>
              {current_stock}
            </span>
            {unit_abbreviation && (
              <span className="text-txt-muted text-xs">{unit_abbreviation}</span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={(getValue() as number) === 1 ? 'success' : 'default'}>
          {(getValue() as number) === 1 ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingId(row.original.id); setFormOpen(true) }}
            className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
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

  const label = profile?.custom_labels?.['Products'] || 'Products'

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title={label}
        subtitle={`${total} total products`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Tag className="w-4 h-4" />}
              onClick={() => setCategoryOpen(true)}
            >
              Categories
            </Button>
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => { setEditingId(null); setFormOpen(true) }}
            >
              Add {profile?.custom_labels?.['Product'] || 'Product'}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: String(c.id), label: c.name }))
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={[
              { value: '', label: 'All Stock' },
              { value: 'low', label: 'Low Stock' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Package className="w-8 h-8" />}
              title={search ? 'No products found' : `No ${label.toLowerCase()} yet`}
              description={search ? 'Try a different search term' : `Add your first ${(profile?.custom_labels?.['Product'] || 'product').toLowerCase()} to get started`}
              action={
                !search ? (
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>
                    Add {profile?.custom_labels?.['Product'] || 'Product'}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <DataTable
            data={products}
            columns={columns}
            onRowClick={(row) => { setEditingId(row.id); setFormOpen(true) }}
          />
        )}
      </Card>

      {/* Product Form Drawer */}
      <ProductForm
        open={formOpen}
        productId={editingId}
        categories={categories}
        onClose={handleFormClose}
      />

      {/* Category Manager Drawer */}
      <Drawer
        open={categoryOpen}
        onClose={() => { setCategoryOpen(false); loadCategories() }}
        title="Manage Categories"
        size="md"
      >
        <CategoryManager
          categories={categories}
          onUpdate={loadCategories}
        />
      </Drawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="This product will be removed. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
