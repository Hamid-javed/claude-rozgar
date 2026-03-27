import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Button, Card, CardHeader, Input, Badge, ConfirmDialog, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { Select } from '@/components/ui/Select'
import { Plus, Trash2, MapPin, Users, TrendingUp, Route } from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface RouteItem {
  id: number; name: string; area: string | null; salesperson_id: number | null
  salesperson_name: string | null; visit_days: string; notes: string | null
  customer_count: number; is_active: number
}

interface Staff { id: number; name: string }

export default function RoutesPage() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Form
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [salespersonId, setSalespersonId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Sales detail
  const [detailRoute, setDetailRoute] = useState<RouteItem | null>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [detailOpen, setDetailOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [rRes, sRes] = await Promise.all([
      window.api.invoke('routes:list'),
      window.api.invoke('staff:list', { is_active: 1 })
    ])
    if (rRes.success) setRoutes(rRes.data)
    if (sRes.success) setStaffList(sRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Route name required'); return }
    setSaving(true)
    const r = await window.api.invoke('routes:create', { name, area: area || null, salesperson_id: salespersonId ? Number(salespersonId) : null, notes: notes || null })
    if (r.success) { toast.success('Route created'); setFormOpen(false); setName(''); setArea(''); setSalespersonId(''); setNotes(''); load() }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const r = await window.api.invoke('routes:delete', { id: deleteId })
    if (r.success) { toast.success('Route removed'); load() } else toast.error(r.error || 'Failed')
    setDeleteId(null)
  }

  const viewRouteSales = async (route: RouteItem) => {
    setDetailRoute(route)
    const r = await window.api.invoke('routes:sales-summary', { routeId: route.id })
    if (r.success) setSalesData(r.data)
    setDetailOpen(true)
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Routes" subtitle={`${routes.length} delivery routes`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>Add Route</Button>} />

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : routes.length === 0 ? <Card><EmptyState icon={<Route className="w-8 h-8" />} title="No routes yet" description="Create delivery routes to organize your sales areas"
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>Add Route</Button>} /></Card>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <button key={route.id} onClick={() => viewRouteSales(route)}
              className="text-left bg-white rounded-xl border border-surface-border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-cyan-600" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(route.id) }}
                  className="p-1 rounded text-txt-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="text-sm font-heading font-semibold text-txt-primary">{route.name}</h3>
              {route.area && <p className="text-xs text-txt-muted mt-0.5">{route.area}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-txt-muted">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {route.customer_count} retailers</span>
                {route.salesperson_name && <span>{route.salesperson_name}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Route Detail Drawer */}
      <Drawer open={detailOpen} onClose={() => { setDetailOpen(false); setDetailRoute(null) }} title={detailRoute?.name || 'Route'} size="lg"
        footer={<Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>}>
        {detailRoute && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-txt-muted">Area</p><p className="text-sm font-medium">{detailRoute.area || '—'}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-txt-muted">Salesperson</p><p className="text-sm font-medium">{detailRoute.salesperson_name || '—'}</p></div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Route-wise Sales</h4>
              {salesData.length === 0 ? <p className="text-sm text-txt-muted text-center py-6">No sales data for this route</p>
              : (
                <div className="border border-surface-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-surface-border">
                      <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Retailer</th>
                      <th className="text-center px-3 py-2 text-xs font-medium text-txt-muted uppercase">Sales</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Total</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Due</th>
                    </tr></thead>
                    <tbody>
                      {salesData.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-surface-border last:border-0">
                          <td className="px-3 py-2 font-medium">{s.customer_name}</td>
                          <td className="px-3 py-2 text-center font-mono">{s.sale_count}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatCurrency(s.total_sales, currency)}</td>
                          <td className="px-3 py-2 text-right font-mono text-danger">{s.total_due > 0 ? formatCurrency(s.total_due, currency) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Route Drawer */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title="Add Route" size="md"
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleAdd}>Create Route</Button></>}>
        <div className="space-y-4">
          <Input label="Route Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North Zone, Market Area" />
          <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Coverage area" />
          <Select label="Salesperson" options={[{ value: '', label: 'None' }, ...staffList.map((s) => ({ value: String(s.id), label: s.name }))]}
            value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove Route" message="This route will be deactivated." confirmText="Remove" variant="danger" />
    </div>
  )
}
