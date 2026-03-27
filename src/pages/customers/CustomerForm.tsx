import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select, Button } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  customer_type: z.string(),
  opening_balance: z.string().optional(),
  credit_limit: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean()
})
type FormData = z.infer<typeof schema>

interface Props { open: boolean; customerId: number | null; onClose: (saved?: boolean) => void }

export function CustomerForm({ open, customerId, onClose }: Props) {
  const isEdit = customerId !== null
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customer_type: 'retail', is_active: true, opening_balance: '0', credit_limit: '0' }
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && customerId) {
      window.api.invoke('customers:get', { id: customerId }).then((r: any) => {
        if (r.success && r.data) {
          const c = r.data
          reset({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '',
            area: c.area || '', customer_type: c.customer_type, opening_balance: String(c.opening_balance || 0),
            credit_limit: String(c.credit_limit || 0), notes: c.notes || '', is_active: !!c.is_active })
        }
      })
    } else {
      reset({ name: '', phone: '', email: '', address: '', area: '', customer_type: 'retail', opening_balance: '0', credit_limit: '0', notes: '', is_active: true })
    }
  }, [open, customerId, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: data.name, phone: data.phone || null, email: data.email || null,
      address: data.address || null, area: data.area || null, customer_type: data.customer_type,
      credit_limit: Number(data.credit_limit) || 0, notes: data.notes || null, is_active: data.is_active ? 1 : 0
    }
    if (!isEdit) { const ob = Number(data.opening_balance) || 0; payload.opening_balance = ob; payload.current_balance = ob }

    const r = isEdit
      ? await window.api.invoke('customers:update', { id: customerId, data: payload })
      : await window.api.invoke('customers:create', payload)
    if (r.success) { toast.success(isEdit ? 'Customer updated' : 'Customer created'); onClose(true) }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  return (
    <Drawer open={open} onClose={() => onClose()} title={isEdit ? 'Edit Customer' : 'Add Customer'} size="md"
      footer={<><Button variant="ghost" onClick={() => onClose()}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{isEdit ? 'Update' : 'Create'}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name *" {...register('name')} error={errors.name?.message} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" {...register('phone')} />
          <Input label="Email" type="email" {...register('email')} />
        </div>
        <Input label="Address" {...register('address')} />
        <Input label="Area" {...register('area')} />
        <Select label="Customer Type" {...register('customer_type')} options={[{ value: 'retail', label: 'Retail' }, { value: 'wholesale', label: 'Wholesale' }]} />
        {!isEdit && <Input label="Opening Balance" type="number" step="0.01" {...register('opening_balance')} hint="Amount this customer owes you" />}
        <Input label="Credit Limit" type="number" step="0.01" {...register('credit_limit')} hint="0 = no limit" />
        <Textarea label="Notes" {...register('notes')} rows={2} />
        <label className="flex items-center gap-2 text-sm text-txt-primary cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="rounded border-surface-border text-primary focus:ring-primary" /> Active
        </label>
      </form>
    </Drawer>
  )
}
