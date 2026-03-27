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
  phone: z.string().optional(), email: z.string().optional(),
  address: z.string().optional(), cnic: z.string().optional(),
  designation: z.string().optional(), department: z.string().optional(),
  salary_type: z.string(), salary_amount: z.string().optional(),
  join_date: z.string().optional(), notes: z.string().optional(), is_active: z.boolean()
})
type FormData = z.infer<typeof schema>

interface Props { open: boolean; staffId: number | null; onClose: (saved?: boolean) => void }

export function StaffForm({ open, staffId, onClose }: Props) {
  const isEdit = staffId !== null
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { salary_type: 'monthly', is_active: true, salary_amount: '0' }
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && staffId) {
      window.api.invoke('staff:get', { id: staffId }).then((r: any) => {
        if (r.success && r.data) {
          const s = r.data
          reset({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '',
            cnic: s.cnic || '', designation: s.designation || '', department: s.department || '',
            salary_type: s.salary_type, salary_amount: String(s.salary_amount), join_date: s.join_date || '',
            notes: s.notes || '', is_active: !!s.is_active })
        }
      })
    } else {
      reset({ name: '', phone: '', email: '', address: '', cnic: '', designation: '', department: '',
        salary_type: 'monthly', salary_amount: '0', join_date: '', notes: '', is_active: true })
    }
  }, [open, staffId, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: data.name, phone: data.phone || null, email: data.email || null,
      address: data.address || null, cnic: data.cnic || null, designation: data.designation || null,
      department: data.department || null, salary_type: data.salary_type,
      salary_amount: Number(data.salary_amount) || 0, join_date: data.join_date || null,
      notes: data.notes || null, is_active: data.is_active ? 1 : 0
    }
    const r = isEdit
      ? await window.api.invoke('staff:update', { id: staffId, data: payload })
      : await window.api.invoke('staff:create', payload)
    if (r.success) { toast.success(isEdit ? 'Staff updated' : 'Staff added'); onClose(true) }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  return (
    <Drawer open={open} onClose={() => onClose()} title={isEdit ? 'Edit Staff' : 'Add Staff'} size="md"
      footer={<><Button variant="ghost" onClick={() => onClose()}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{isEdit ? 'Update' : 'Create'}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name *" {...register('name')} error={errors.name?.message} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" {...register('phone')} />
          <Input label="Email" {...register('email')} />
        </div>
        <Input label="Address" {...register('address')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="CNIC / ID" {...register('cnic')} />
          <Input label="Join Date" type="date" {...register('join_date')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Designation" {...register('designation')} placeholder="e.g. Cashier, Manager" />
          <Input label="Department" {...register('department')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Salary Type" {...register('salary_type')} options={[
            { value: 'monthly', label: 'Monthly' }, { value: 'daily', label: 'Daily' }, { value: 'hourly', label: 'Hourly' }
          ]} />
          <Input label="Salary Amount" type="number" step="0.01" {...register('salary_amount')} />
        </div>
        <Textarea label="Notes" {...register('notes')} rows={2} />
        <label className="flex items-center gap-2 text-sm text-txt-primary cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="rounded border-surface-border text-primary focus:ring-primary" /> Active
        </label>
      </form>
    </Drawer>
  )
}
