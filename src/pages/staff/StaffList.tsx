import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { UserCheck, Plus, Search, Edit2, Trash2, Calendar, CreditCard } from 'lucide-react'
import { PageHeader, Button, Input, DataTable, Badge, Card, ConfirmDialog, EmptyState } from '@/components/ui'
import { StaffForm } from './StaffForm'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Staff {
  id: number; name: string; phone: string | null; designation: string | null
  department: string | null; salary_type: string; salary_amount: number; is_active: number
}

export default function StaffList() {
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const currency = profile?.currency_symbol || 'Rs.'

  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    const r = await window.api.invoke('staff:list', search ? { search } : {})
    if (r.success) setStaff(r.data)
    setLoading(false)
  }, [search])

  useEffect(() => { loadStaff() }, [loadStaff])
  useEffect(() => { const t = setTimeout(() => setSearch(searchInput), 300); return () => clearTimeout(t) }, [searchInput])

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true)
    const r = await window.api.invoke('staff:delete', { id: deleteId })
    if (r.success) { toast.success('Staff removed'); loadStaff() } else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const columns = useMemo<ColumnDef<Staff, unknown>[]>(() => [
    {
      accessorKey: 'name', header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-txt-primary">{row.original.name}</p>
          {row.original.designation && <p className="text-xs text-txt-muted">{row.original.designation}</p>}
        </div>
      )
    },
    { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || '—'}</span> },
    { accessorKey: 'department', header: 'Department', cell: ({ getValue }) => getValue() ? <Badge variant="default">{getValue() as string}</Badge> : <span className="text-txt-muted text-xs">—</span> },
    {
      accessorKey: 'salary_amount', header: 'Salary',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm font-medium">{formatCurrency(row.original.salary_amount, currency)}</span>
          <span className="text-xs text-txt-muted ml-1">/{row.original.salary_type === 'monthly' ? 'mo' : row.original.salary_type === 'daily' ? 'day' : 'hr'}</span>
        </div>
      )
    },
    { accessorKey: 'is_active', header: 'Status', cell: ({ getValue }) => <Badge variant={(getValue() as number) === 1 ? 'success' : 'default'}>{(getValue() as number) === 1 ? 'Active' : 'Inactive'}</Badge> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setEditingId(row.original.id); setFormOpen(true) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Staff" subtitle={`${staff.length} members`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Calendar className="w-4 h-4" />} onClick={() => navigate('/staff/attendance')}>Attendance</Button>
            <Button variant="secondary" size="sm" icon={<CreditCard className="w-4 h-4" />} onClick={() => navigate('/staff/payroll')}>Payroll</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add Staff</Button>
          </div>
        } />
      <Card><Input placeholder="Search staff..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} leftIcon={<Search className="w-4 h-4" />} /></Card>
      <Card padding={false}>
        {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        : staff.length === 0 ? <div className="py-16"><EmptyState icon={<UserCheck className="w-8 h-8" />} title={search ? 'No results' : 'No staff yet'}
            action={!search ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingId(null); setFormOpen(true) }}>Add Staff</Button> : undefined} /></div>
        : <DataTable data={staff} columns={columns} />}
      </Card>
      <StaffForm open={formOpen} staffId={editingId} onClose={(saved) => { setFormOpen(false); setEditingId(null); if (saved) loadStaff() }} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Staff" message="This staff member will be removed." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
