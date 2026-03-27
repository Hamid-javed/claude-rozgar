import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Button } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  area: z.string().optional(),
  opening_balance: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean()
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  supplierId: number | null
  onClose: (saved?: boolean) => void
}

export function SupplierForm({ open, supplierId, onClose }: Props) {
  const isEdit = supplierId !== null
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, opening_balance: '0' }
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && supplierId) {
      window.api.invoke('suppliers:get', { id: supplierId }).then((r: any) => {
        if (r.success && r.data) {
          const s = r.data
          reset({
            name: s.name, company: s.company || '', phone: s.phone || '',
            phone2: s.phone2 || '', email: s.email || '', address: s.address || '',
            area: s.area || '', opening_balance: String(s.opening_balance || 0),
            notes: s.notes || '', is_active: !!s.is_active
          })
        }
      })
    } else {
      reset({ name: '', company: '', phone: '', phone2: '', email: '', address: '', area: '', opening_balance: '0', notes: '', is_active: true })
    }
  }, [open, supplierId, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      phone2: data.phone2 || null,
      email: data.email || null,
      address: data.address || null,
      area: data.area || null,
      notes: data.notes || null,
      is_active: data.is_active ? 1 : 0
    }
    if (!isEdit) {
      const ob = Number(data.opening_balance) || 0
      payload.opening_balance = ob
      payload.current_balance = ob
    }

    const r = isEdit
      ? await window.api.invoke('suppliers:update', { id: supplierId, data: payload })
      : await window.api.invoke('suppliers:create', payload)

    if (r.success) {
      toast.success(isEdit ? 'Supplier updated' : 'Supplier created')
      onClose(true)
    } else {
      toast.error(r.error || 'Failed')
    }
    setSaving(false)
  }

  return (
    <Drawer open={open} onClose={() => onClose()} title={isEdit ? 'Edit Supplier' : 'Add Supplier'} size="md"
      footer={<><Button variant="ghost" onClick={() => onClose()}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{isEdit ? 'Update' : 'Create'}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name *" {...register('name')} error={errors.name?.message} />
        <Input label="Company" {...register('company')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" {...register('phone')} />
          <Input label="Phone 2" {...register('phone2')} />
        </div>
        <Input label="Email" type="email" {...register('email')} />
        <Input label="Address" {...register('address')} />
        <Input label="Area" {...register('area')} />
        {!isEdit && <Input label="Opening Balance" type="number" step="0.01" {...register('opening_balance')} hint="Amount you owe this supplier" />}
        <Textarea label="Notes" {...register('notes')} rows={2} />
        <label className="flex items-center gap-2 text-sm text-txt-primary cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="rounded border-surface-border text-primary focus:ring-primary" />
          Active
        </label>
      </form>
    </Drawer>
  )
}
