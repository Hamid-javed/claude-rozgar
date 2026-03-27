import { useState, useEffect, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Receipt, Plus, Search, Edit2, Trash2, Fuel, Utensils, Zap, Wrench, Truck, Megaphone, CircleDollarSign, Tag } from 'lucide-react'
import { PageHeader, Button, Input, Select, DataTable, Badge, Card, CardHeader, ConfirmDialog, EmptyState } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { ExpenseForm } from './ExpenseForm'
import { useProfileStore } from '@/store/profileStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, getTodayISO } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface Expense {
  id: number; expense_date: string; category_name: string | null; title: string
  amount: number; payment_method: string; paid_to: string | null; created_at: string
}

interface Category {
  id: number; name: string; icon: string | null; color: string | null; is_daily: number
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Fuel': <Fuel className="w-4 h-4" />, 'Food/Meals': <Utensils className="w-4 h-4" />,
  'Electricity': <Zap className="w-4 h-4" />, 'Maintenance': <Wrench className="w-4 h-4" />,
  'Transport': <Truck className="w-4 h-4" />, 'Marketing': <Megaphone className="w-4 h-4" />
}

export default function ExpenseList() {
  const { profile } = useProfileStore()
  const { user } = useAuthStore()
  const currency = profile?.currency_symbol || 'Rs.'

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [todayTotal, setTodayTotal] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = { page: 1, pageSize: 200 }
    if (search) params.search = search
    if (categoryFilter) params.category_id = Number(categoryFilter)
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo

    const [expRes, todayRes] = await Promise.all([
      window.api.invoke('expenses:list', params),
      window.api.invoke('expenses:today-summary')
    ])
    if (expRes.success) { setExpenses(expRes.data); setTotal(expRes.total) }
    if (todayRes.success) setTodayTotal(todayRes.data.total)
    setLoading(false)
  }, [search, categoryFilter, dateFrom, dateTo])

  const loadCategories = useCallback(async () => {
    const r = await window.api.invoke('expense-categories:list')
    if (r.success) setCategories(r.data)
  }, [])

  useEffect(() => { loadExpenses(); loadCategories() }, [loadExpenses, loadCategories])
  useEffect(() => { const t = setTimeout(() => setSearch(searchInput), 300); return () => clearTimeout(t) }, [searchInput])

  const handleQuickAdd = async (cat: Category) => {
    const title = prompt(`${cat.name} expense amount:`)
    if (!title) return
    const amount = Number(title)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }

    const r = await window.api.invoke('expenses:create', {
      expense_date: getTodayISO(),
      category_id: cat.id,
      category_name: cat.name,
      title: cat.name,
      amount,
      payment_method: 'cash',
      created_by: user?.id
    })
    if (r.success) { toast.success(`${cat.name} expense added`); loadExpenses() }
    else toast.error(r.error || 'Failed')
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const r = await window.api.invoke('expenses:delete', { id: deleteId })
    if (r.success) { toast.success('Expense deleted'); loadExpenses() }
    else toast.error(r.error || 'Failed')
    setDeleteId(null); setDeleting(false)
  }

  const dailyCategories = categories.filter((c) => c.is_daily)

  const columns = useMemo<ColumnDef<Expense, unknown>[]>(() => [
    {
      accessorKey: 'expense_date', header: 'Date',
      cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string)}</span>
    },
    {
      accessorKey: 'category_name', header: 'Category',
      cell: ({ getValue }) => getValue() ? <Badge variant="warning">{getValue() as string}</Badge> : <span className="text-txt-muted text-xs">—</span>
    },
    {
      accessorKey: 'title', header: 'Title',
      cell: ({ getValue }) => <span className="text-sm font-medium text-txt-primary">{getValue() as string}</span>
    },
    {
      accessorKey: 'amount', header: 'Amount',
      cell: ({ getValue }) => <span className="font-mono text-sm font-semibold text-danger">{formatCurrency(getValue() as number, currency)}</span>
    },
    {
      accessorKey: 'payment_method', header: 'Payment',
      cell: ({ getValue }) => <span className="text-xs text-txt-secondary capitalize">{(getValue() as string).replace('_', ' ')}</span>
    },
    {
      accessorKey: 'paid_to', header: 'Paid To',
      cell: ({ getValue }) => <span className="text-sm text-txt-secondary">{(getValue() as string) || '—'}</span>
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); setEditingExpense(row.original); setFormOpen(true) }}
            className="p-1.5 rounded-md text-txt-secondary hover:bg-gray-100 transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.original.id) }}
            className="p-1.5 rounded-md text-txt-secondary hover:bg-red-50 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ], [currency])

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Expenses" subtitle={`${total} total expenses`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingExpense(null); setFormOpen(true) }}>Add Expense</Button>} />

      {/* Today's summary + Quick add tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1" style={{ borderLeft: '4px solid #D97706' } as React.CSSProperties}>
          <p className="text-xs text-txt-muted uppercase tracking-wide">Today's Expenses</p>
          <p className="text-2xl font-heading font-bold text-warning mt-1">{formatCurrency(todayTotal, currency)}</p>
        </Card>
        {dailyCategories.length > 0 && (
          <Card className="lg:col-span-3">
            <p className="text-xs font-medium text-txt-muted uppercase tracking-wide mb-2">Quick Add</p>
            <div className="flex flex-wrap gap-2">
              {dailyCategories.map((cat) => (
                <button key={cat.id} onClick={() => handleQuickAdd(cat)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-sm font-medium text-txt-secondary hover:bg-gray-50 hover:border-primary/30 transition-all active:scale-[0.98]">
                  {categoryIcons[cat.name] || <CircleDollarSign className="w-4 h-4" />}
                  {cat.name}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1"><Input placeholder="Search expenses..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} leftIcon={<Search className="w-4 h-4" />} /></div>
          <Select options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
            value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-44" />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : expenses.length === 0 ? (
          <div className="py-16"><EmptyState icon={<Receipt className="w-8 h-8" />} title={search ? 'No expenses found' : 'No expenses yet'}
            action={!search ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingExpense(null); setFormOpen(true) }}>Add Expense</Button> : undefined} /></div>
        ) : (
          <DataTable data={expenses} columns={columns} />
        )}
      </Card>

      <ExpenseForm open={formOpen} expense={editingExpense} categories={categories}
        onClose={(saved) => { setFormOpen(false); setEditingExpense(null); if (saved) loadExpenses() }} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Expense" message="This expense record will be removed." confirmText="Delete" variant="danger" loading={deleting} />
    </div>
  )
}
