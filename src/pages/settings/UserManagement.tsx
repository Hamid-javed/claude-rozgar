import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Shield, Plus, Edit2, Trash2, KeyRound } from 'lucide-react'
import { PageHeader, Button, Input, DataTable, Badge, Card, ConfirmDialog, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { Select } from '@/components/ui/Select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface User {
  id: number; name: string; username: string; role: string; is_active: number; last_login: string | null; created_at: string
}

const roleVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  owner: 'danger', manager: 'warning', cashier: 'info', staff: 'default'
}

const userSchema = z.object({
  name: z.string().min(1, 'Name required'),
  username: z.string().min(3, 'Min 3 characters'),
  password: z.string().optional(),
  role: z.string().min(1)
})
type UserForm = z.infer<typeof userSchema>

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [resetId, setResetId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'staff' }
  })

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.api.invoke('users:list')
    if (r.success) setUsers(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (user: User) => {
    setEditingUser(user)
    reset({ name: user.name, username: user.username, role: user.role, password: '' })
    setFormOpen(true)
  }

  const openCreate = () => {
    setEditingUser(null)
    reset({ name: '', username: '', role: 'staff', password: '' })
    setFormOpen(true)
  }

  const onSubmit = async (data: UserForm) => {
    setSaving(true)
    if (editingUser) {
      const payload: Record<string, unknown> = { name: data.name, username: data.username, role: data.role }
      const r = await window.api.invoke('users:update', { id: editingUser.id, data: payload })
      if (r.success) { toast.success('User updated'); setFormOpen(false); load() } else toast.error(r.error || 'Failed')
    } else {
      if (!data.password || data.password.length < 4) { toast.error('Password must be at least 4 characters'); setSaving(false); return }
      const r = await window.api.invoke('users:create', { name: data.name, username: data.username, password: data.password, role: data.role })
      if (r.success) { toast.success('User created'); setFormOpen(false); load() } else toast.error(r.error || 'Failed')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true)
    const r = await window.api.invoke('users:delete', { id: deleteId })
    if (r.success) { toast.success('User removed'); load() } else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const handleResetPassword = async () => {
    if (!resetId || newPassword.length < 4) { toast.error('Min 4 characters'); return }
    const r = await window.api.invoke('users:reset-password', { id: resetId, password: newPassword })
    if (r.success) { toast.success('Password reset'); setResetId(null); setNewPassword('') }
    else toast.error(r.error || 'Failed')
  }

  const columns = useMemo<ColumnDef<User, unknown>[]>(() => [
    { accessorKey: 'name', header: 'Name', cell: ({ getValue }) => <span className="text-sm font-medium text-txt-primary">{getValue() as string}</span> },
    { accessorKey: 'username', header: 'Username', cell: ({ getValue }) => <span className="text-sm font-mono">{getValue() as string}</span> },
    { accessorKey: 'role', header: 'Role', cell: ({ getValue }) => <Badge variant={roleVariant[(getValue() as string)] || 'default'}>{getValue() as string}</Badge> },
    { accessorKey: 'last_login', header: 'Last Login', cell: ({ getValue }) => <span className="text-xs text-txt-muted">{getValue() ? formatDate(getValue() as string, 'dd MMM, hh:mm a') : 'Never'}</span> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row.original) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setResetId(row.original.id); setNewPassword('') }} className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100" title="Reset password"><KeyRound className="w-4 h-4" /></button>
          {row.original.role !== 'owner' && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }} className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      )
    }
  ], [])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="User Management" subtitle={`${users.length} users`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add User</Button>} />

      <Card padding={false}>
        {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        : <DataTable data={users} columns={columns} />}
      </Card>

      {/* User Form */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title={editingUser ? 'Edit User' : 'Add User'} size="md"
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editingUser ? 'Update' : 'Create'}</Button></>}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name *" {...register('name')} error={errors.name?.message} />
          <Input label="Username *" {...register('username')} error={errors.username?.message} />
          {!editingUser && <Input label="Password *" type="password" {...register('password')} hint="Min 4 characters" />}
          <Select label="Role *" {...register('role')} options={[
            { value: 'owner', label: 'Owner (full access)' }, { value: 'manager', label: 'Manager' },
            { value: 'cashier', label: 'Cashier' }, { value: 'staff', label: 'Staff' }
          ]} />
        </form>
      </Drawer>

      {/* Reset Password Modal */}
      {resetId && (
        <Drawer open={!!resetId} onClose={() => setResetId(null)} title="Reset Password" size="md"
          footer={<><Button variant="ghost" onClick={() => setResetId(null)}>Cancel</Button><Button onClick={handleResetPassword}>Reset Password</Button></>}>
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="Min 4 characters" autoFocus />
        </Drawer>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete User" message="This user will be removed and can no longer log in." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
