import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Users, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import { PageHeader, Button, Input, Select, DataTable, Badge, Card, ConfirmDialog, EmptyState } from '@/components/ui'
import { CustomerForm } from './CustomerForm'
import { CustomerProfile } from './CustomerProfile'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface Customer {
  id: number; name: string; phone: string | null; customer_type: string
  current_balance: number; loyalty_points: number; is_active: number
}

export default function CustomerList() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'
  const label = profile?.custom_labels?.['Customer'] || 'Customer'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = {}
    if (search) params.search = search
    if (typeFilter) params.customer_type = typeFilter
    const r = await window.api.invoke('customers:list', params)
    if (r.success) setCustomers(r.data)
    setLoading(false)
  }, [search, typeFilter])

  useEffect(() => { loadCustomers() }, [loadCustomers])
  useEffect(() => { const t = setTimeout(() => setSearch(searchInput), 300); return () => clearTimeout(t) }, [searchInput])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const r = await window.api.invoke('customers:delete', { id: deleteId })
    if (r.success) { toast.success(`${label} deleted`); loadCustomers() }
    else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const columns = useMemo<ColumnDef<Customer, unknown>[]>(() => [
    {
      accessorKey: 'name', header: 'Name',
      cell: ({ getValue }) => <span className="text-sm font-medium text-txt-primary">{getValue() as string}</span>
    },
    {
      accessorKey: 'phone', header: 'Phone',
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span>
    },
    {
      accessorKey: 'customer_type', header: 'Type',
      cell: ({ getValue }) => <Badge variant={(getValue() as string) === 'wholesale' ? 'info' : 'default'}>{getValue() as string}</Badge>
    },
    {
      accessorKey: 'current_balance', header: 'Balance Due',
      cell: ({ getValue }) => {
        const bal = getValue() as number
        return bal > 0
          ? <span className="font-mono text-sm text-danger font-medium">{formatCurrency(bal, currency)}</span>
          : <span className="font-mono text-sm text-txt-muted">{formatCurrency(0, currency)}</span>
      }
    },
    {
      accessorKey: 'loyalty_points', header: 'Points',
      cell: ({ getValue }) => {
        const pts = getValue() as number
        return pts > 0 ? <Badge variant="info">{pts} pts</Badge> : <span className="text-txt-muted text-xs">—</span>
      }
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setProfileId(row.original.id); setProfileOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.original.id); setFormOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title={`${label}s`} subtitle={`${customers.length} total`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add {label}</Button>} />
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1"><Input placeholder={`Search ${label.toLowerCase()}s...`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} leftIcon={<Search className="w-4 h-4" />} /></div>
          <Select options={[{ value: '', label: 'All Types' }, { value: 'retail', label: 'Retail' }, { value: 'wholesale', label: 'Wholesale' }]}
            value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36" />
        </div>
      </Card>
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : customers.length === 0 ? (
          <div className="py-16"><EmptyState icon={<Users className="w-8 h-8" />} title={search ? 'No results' : `No ${label.toLowerCase()}s yet`}
            action={!search ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add {label}</Button> : undefined} /></div>
        ) : (
          <DataTable data={customers} columns={columns} onRowClick={(row) => { setProfileId(row.id); setProfileOpen(true) }} />
        )}
      </Card>
      <CustomerForm open={formOpen} customerId={editingId} onClose={(saved) => { setFormOpen(false); setEditingId(null); if (saved) loadCustomers() }} />
      {profileId && <CustomerProfile open={profileOpen} customerId={profileId} currency={currency} onClose={() => { setProfileOpen(false); setProfileId(null); loadCustomers() }} />}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={`Delete ${label}`} message="This will soft-delete the customer." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
