import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Truck, Plus, Search, Edit2, Trash2, Eye, Banknote } from 'lucide-react'
import { PageHeader, Button, Input, DataTable, Badge, Card, ConfirmDialog, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { SupplierForm } from './SupplierForm'
import { SupplierProfile } from './SupplierProfile'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface Supplier {
  id: number; name: string; company: string | null; phone: string | null
  current_balance: number; is_active: number
}

export default function SupplierList() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'
  const label = profile?.custom_labels?.['Supplier'] || 'Supplier'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = {}
    if (search) params.search = search
    const r = await window.api.invoke('suppliers:list', params)
    if (r.success) setSuppliers(r.data)
    setLoading(false)
  }, [search])

  useEffect(() => { loadSuppliers() }, [loadSuppliers])
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const r = await window.api.invoke('suppliers:delete', { id: deleteId })
    if (r.success) { toast.success(`${label} deleted`); loadSuppliers() }
    else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const columns = useMemo<ColumnDef<Supplier, unknown>[]>(() => [
    {
      accessorKey: 'name', header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-txt-primary">{row.original.name}</p>
          {row.original.company && <p className="text-xs text-txt-muted">{row.original.company}</p>}
        </div>
      )
    },
    {
      accessorKey: 'phone', header: 'Phone',
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span>
    },
    {
      accessorKey: 'current_balance', header: 'Balance',
      cell: ({ getValue }) => {
        const bal = getValue() as number
        return bal > 0
          ? <span className="font-mono text-sm text-danger font-medium">{formatCurrency(bal, currency)}</span>
          : <span className="font-mono text-sm text-txt-muted">{formatCurrency(0, currency)}</span>
      }
    },
    {
      accessorKey: 'is_active', header: 'Status',
      cell: ({ getValue }) => <Badge variant={(getValue() as number) === 1 ? 'success' : 'default'}>{(getValue() as number) === 1 ? 'Active' : 'Inactive'}</Badge>
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setProfileId(row.original.id); setProfileOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.original.id); setFormOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title={`${label}s`} subtitle={`${suppliers.length} total`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add {label}</Button>} />
      <Card>
        <Input placeholder={`Search ${label.toLowerCase()}s...`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
      </Card>
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : suppliers.length === 0 ? (
          <div className="py-16"><EmptyState icon={<Truck className="w-8 h-8" />} title={search ? 'No results' : `No ${label.toLowerCase()}s yet`}
            action={!search ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add {label}</Button> : undefined} /></div>
        ) : (
          <DataTable data={suppliers} columns={columns} onRowClick={(row) => { setProfileId(row.id); setProfileOpen(true) }} />
        )}
      </Card>

      <SupplierForm open={formOpen} supplierId={editingId} onClose={(saved) => { setFormOpen(false); setEditingId(null); if (saved) loadSuppliers() }} />
      {profileId && <SupplierProfile open={profileOpen} supplierId={profileId} currency={currency} onClose={() => { setProfileOpen(false); setProfileId(null); loadSuppliers() }} />}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={`Delete ${label}`} message="This will soft-delete the supplier." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
