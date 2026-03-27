import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select, Button } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthStore } from '@/store/authStore'
import { getTodayISO } from '@/utils/formatters'
import toast from 'react-hot-toast'

const schema = z.object({
  expense_date: z.string().min(1, 'Date is required'),
  category_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  amount: z.string().min(1, 'Amount is required'),
  payment_method: z.string(),
  paid_to: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional()
})

type FormData = z.infer<typeof schema>

interface Category { id: number; name: string }
interface Expense {
  id: number; expense_date: string; category_id?: number | null; category_name: string | null
  title: string; amount: number; payment_method: string; paid_to: string | null; notes?: string | null
}

interface Props {
  open: boolean
  expense: Expense | null
  categories: Category[]
  onClose: (saved?: boolean) => void
}

export function ExpenseForm({ open, expense, categories, onClose }: Props) {
  const { user } = useAuthStore()
  const isEdit = expense !== null
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { expense_date: getTodayISO(), payment_method: 'cash' }
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && expense) {
      reset({
        expense_date: expense.expense_date, category_id: expense.category_id ? String(expense.category_id) : '',
        title: expense.title, amount: String(expense.amount), payment_method: expense.payment_method,
        paid_to: expense.paid_to || '', notes: expense.notes || ''
      })
    } else {
      reset({ expense_date: getTodayISO(), category_id: '', title: '', amount: '', payment_method: 'cash', paid_to: '', reference: '', notes: '' })
    }
  }, [open, expense, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const cat = categories.find((c) => String(c.id) === data.category_id)
    const payload: Record<string, unknown> = {
      expense_date: data.expense_date,
      category_id: data.category_id ? Number(data.category_id) : null,
      category_name: cat?.name || null,
      title: data.title,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      paid_to: data.paid_to || null,
      reference: data.reference || null,
      notes: data.notes || null
    }

    const r = isEdit
      ? await window.api.invoke('expenses:update', { id: expense!.id, data: payload })
      : await window.api.invoke('expenses:create', { ...payload, created_by: user?.id })

    if (r.success) { toast.success(isEdit ? 'Expense updated' : 'Expense added'); onClose(true) }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  return (
    <Drawer open={open} onClose={() => onClose()} title={isEdit ? 'Edit Expense' : 'Add Expense'} size="md"
      footer={<><Button variant="ghost" onClick={() => onClose()}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{isEdit ? 'Update' : 'Save'}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Date *" type="date" {...register('expense_date')} error={errors.expense_date?.message} />
        <Select label="Category" {...register('category_id')} placeholder="Select category"
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
        <Input label="Title *" {...register('title')} error={errors.title?.message} placeholder="What was this expense for?" />
        <Input label="Amount *" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
        <Select label="Payment Method" {...register('payment_method')} options={[
          { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
          { value: 'bank_transfer', label: 'Bank Transfer' }
        ]} />
        <Input label="Paid To" {...register('paid_to')} placeholder="Person or vendor" />
        <Input label="Reference #" {...register('reference')} placeholder="Receipt number, etc." />
        <Textarea label="Notes" {...register('notes')} rows={2} />
      </form>
    </Drawer>
  )
}
