import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Button, Card, Input, Badge, ConfirmDialog } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { Plus, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Table {
  id: number; table_number: string; capacity: number; area: string | null
  status: string; current_order_id: number | null; notes: string | null
}

const statusColors: Record<string, string> = {
  free: 'bg-green-50 border-green-300 text-green-700',
  occupied: 'bg-red-50 border-red-300 text-red-700',
  reserved: 'bg-amber-50 border-amber-300 text-amber-700',
  cleaning: 'bg-blue-50 border-blue-300 text-blue-700'
}

const statusLabels: Record<string, string> = {
  free: 'Free', occupied: 'Occupied', reserved: 'Reserved', cleaning: 'Cleaning'
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [newNumber, setNewNumber] = useState('')
  const [newCapacity, setNewCapacity] = useState('4')
  const [newArea, setNewArea] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.api.invoke('tables:list')
    if (r.success) setTables(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!newNumber.trim()) { toast.error('Table number required'); return }
    setSaving(true)
    const r = await window.api.invoke('tables:create', { table_number: newNumber, capacity: Number(newCapacity) || 4, area: newArea || null })
    if (r.success) { toast.success('Table added'); setFormOpen(false); setNewNumber(''); setNewCapacity('4'); setNewArea(''); load() }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  const toggleStatus = async (table: Table) => {
    const next: Record<string, string> = { free: 'occupied', occupied: 'cleaning', cleaning: 'free', reserved: 'occupied' }
    const newStatus = next[table.status] || 'free'
    await window.api.invoke('tables:update-status', { id: table.id, status: newStatus })
    load()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const r = await window.api.invoke('tables:delete', { id: deleteId })
    if (r.success) { toast.success('Table removed'); load() } else toast.error(r.error || 'Failed')
    setDeleteId(null)
  }

  const counts = {
    free: tables.filter((t) => t.status === 'free').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Table Management" subtitle={`${tables.length} tables · ${counts.free} free · ${counts.occupied} occupied`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>Add Table</Button>} />

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : tables.length === 0 ? (
        <Card className="text-center py-16"><Users className="w-10 h-10 mx-auto text-txt-muted opacity-40 mb-3" /><p className="text-sm text-txt-muted">No tables configured</p>
          <Button size="sm" className="mt-3" icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>Add Table</Button></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <button key={table.id} onClick={() => toggleStatus(table)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all hover:shadow-md active:scale-[0.98] ${statusColors[table.status] || statusColors.free}`}>
              <button onClick={(e) => { e.stopPropagation(); setDeleteId(table.id) }}
                className="absolute top-2 right-2 p-1 rounded text-current opacity-30 hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <p className="text-2xl font-heading font-bold">{table.table_number}</p>
              <p className="text-xs font-medium mt-1">{statusLabels[table.status]}</p>
              <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                <Users className="w-3 h-3" /> {table.capacity} seats
              </div>
              {table.area && <p className="text-xs opacity-60 mt-0.5">{table.area}</p>}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-txt-muted">
        <span>Click table to cycle status:</span>
        {Object.entries(statusLabels).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full ${key === 'free' ? 'bg-green-500' : key === 'occupied' ? 'bg-red-500' : key === 'reserved' ? 'bg-amber-500' : 'bg-blue-500'}`} />{label}</span>
        ))}
      </div>

      {/* Add Table Drawer */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title="Add Table" size="md"
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleAdd}>Add Table</Button></>}>
        <div className="space-y-4">
          <Input label="Table Number *" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="e.g. T1, A1, 01" />
          <Input label="Capacity" type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} />
          <Input label="Area" value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="e.g. Indoor, Outdoor, VIP" />
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove Table" message="This table will be permanently removed." confirmText="Remove" variant="danger" />
    </div>
  )
}
