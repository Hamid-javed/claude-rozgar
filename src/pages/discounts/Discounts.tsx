import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Percent, Plus, Edit2, Trash2, Tag } from 'lucide-react'
import { PageHeader, Button, DataTable, Badge, Card, ConfirmDialog, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { DiscountForm } from './DiscountForm'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface Discount {
  id: number; name: string; discount_type: string; value: number | null
  min_purchase: number; applies_to: string; customer_type: string
  start_date: string | null; end_date: string | null; is_active: number
  usage_count: number; max_uses: number
}

export default function Discounts() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.api.invoke('discounts:list', {})
    if (r.success) setDiscounts(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true)
    const r = await window.api.invoke('discounts:delete', { id: deleteId })
    if (r.success) { toast.success('Discount deleted'); load() } else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const columns = useMemo<ColumnDef<Discount, unknown>[]>(() => [
    {
      accessorKey: 'name', header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><Percent className="w-4 h-4 text-violet-600" /></div>
          <span className="text-sm font-medium text-txt-primary">{row.original.name}</span>
        </div>
      )
    },
    {
      accessorKey: 'discount_type', header: 'Type',
      cell: ({ row }) => {
        const d = row.original
        const label = d.discount_type === 'percent' ? `${d.value}% off`
          : d.discount_type === 'amount' ? `${formatCurrency(d.value || 0, currency)} off`
          : d.discount_type
        return <Badge variant="info">{label}</Badge>
      }
    },
    {
      accessorKey: 'min_purchase', header: 'Min Purchase',
      cell: ({ getValue }) => {
        const v = getValue() as number
        return v > 0 ? <span className="font-mono text-sm">{formatCurrency(v, currency)}</span> : <span className="text-txt-muted text-xs">None</span>
      }
    },
    { accessorKey: 'applies_to', header: 'Applies To', cell: ({ getValue }) => <span className="text-sm capitalize">{getValue() as string}</span> },
    { accessorKey: 'customer_type', header: 'Customer', cell: ({ getValue }) => <span className="text-sm capitalize">{getValue() as string}</span> },
    {
      id: 'dates', header: 'Valid Period',
      cell: ({ row }) => {
        const { start_date, end_date } = row.original
        if (!start_date && !end_date) return <span className="text-txt-muted text-xs">Always</span>
        return <span className="text-xs">{start_date ? formatDate(start_date, 'dd MMM') : '...'} - {end_date ? formatDate(end_date, 'dd MMM') : '...'}</span>
      }
    },
    {
      id: 'usage', header: 'Usage',
      cell: ({ row }) => <span className="text-xs text-txt-secondary">{row.original.usage_count}{row.original.max_uses > 0 ? `/${row.original.max_uses}` : ''}</span>
    },
    {
      accessorKey: 'is_active', header: 'Status',
      cell: ({ getValue }) => <Badge variant={(getValue() as number) === 1 ? 'success' : 'default'}>{(getValue() as number) === 1 ? 'Active' : 'Inactive'}</Badge>
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.original.id); setFormOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Discounts & Promotions" subtitle={`${discounts.length} discounts`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add Discount</Button>} />
      <Card padding={false}>
        {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        : discounts.length === 0 ? <div className="py-16"><EmptyState icon={<Tag className="w-8 h-8" />} title="No discounts yet" description="Create promotions to attract customers"
            action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add Discount</Button>} /></div>
        : <DataTable data={discounts} columns={columns} />}
      </Card>
      <DiscountForm open={formOpen} discountId={editingId} onClose={(saved) => { setFormOpen(false); setEditingId(null); if (saved) load() }} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Discount" message="This discount will be removed." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
