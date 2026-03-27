import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select, Button } from '@/components/ui'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  discount_type: z.string().min(1),
  value: z.string().optional(),
  min_purchase: z.string().optional(),
  applies_to: z.string(),
  customer_type: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_uses: z.string().optional(),
  is_active: z.boolean()
})
type FormData = z.infer<typeof schema>

interface Props { open: boolean; discountId: number | null; onClose: (saved?: boolean) => void }

export function DiscountForm({ open, discountId, onClose }: Props) {
  const isEdit = discountId !== null
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount_type: 'percent', applies_to: 'all', customer_type: 'all', is_active: true, min_purchase: '0', max_uses: '0' }
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && discountId) {
      window.api.invoke('discounts:get', { id: discountId }).then((r: any) => {
        if (r.success && r.data) {
          const d = r.data
          reset({ name: d.name, discount_type: d.discount_type, value: String(d.value || ''), min_purchase: String(d.min_purchase || 0),
            applies_to: d.applies_to, customer_type: d.customer_type, start_date: d.start_date || '', end_date: d.end_date || '',
            max_uses: String(d.max_uses || 0), is_active: !!d.is_active })
        }
      })
    } else {
      reset({ name: '', discount_type: 'percent', value: '', min_purchase: '0', applies_to: 'all', customer_type: 'all', start_date: '', end_date: '', max_uses: '0', is_active: true })
    }
  }, [open, discountId, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: data.name, discount_type: data.discount_type, value: Number(data.value) || 0,
      min_purchase: Number(data.min_purchase) || 0, applies_to: data.applies_to,
      customer_type: data.customer_type, start_date: data.start_date || null, end_date: data.end_date || null,
      max_uses: Number(data.max_uses) || 0, is_active: data.is_active ? 1 : 0
    }
    const r = isEdit
      ? await window.api.invoke('discounts:update', { id: discountId, data: payload })
      : await window.api.invoke('discounts:create', payload)
    if (r.success) { toast.success(isEdit ? 'Discount updated' : 'Discount created'); onClose(true) }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  return (
    <Drawer open={open} onClose={() => onClose()} title={isEdit ? 'Edit Discount' : 'Add Discount'} size="md"
      footer={<><Button variant="ghost" onClick={() => onClose()}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{isEdit ? 'Update' : 'Create'}</Button></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Discount Name *" {...register('name')} error={errors.name?.message} placeholder="e.g. 10% Off Summer Sale" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type *" {...register('discount_type')} options={[
            { value: 'percent', label: 'Percentage (%)' }, { value: 'amount', label: 'Fixed Amount' },
            { value: 'buy_x_get_y', label: 'Buy X Get Y' }
          ]} />
          <Input label="Value" type="number" step="0.01" {...register('value')} placeholder="e.g. 10" />
        </div>
        <Input label="Minimum Purchase" type="number" step="0.01" {...register('min_purchase')} hint="0 = no minimum" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Applies To" {...register('applies_to')} options={[
            { value: 'all', label: 'All Products' }, { value: 'category', label: 'Specific Category' }, { value: 'product', label: 'Specific Product' }
          ]} />
          <Select label="Customer Type" {...register('customer_type')} options={[
            { value: 'all', label: 'All Customers' }, { value: 'retail', label: 'Retail Only' }, { value: 'wholesale', label: 'Wholesale Only' }
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" {...register('start_date')} />
          <Input label="End Date" type="date" {...register('end_date')} />
        </div>
        <Input label="Max Uses" type="number" {...register('max_uses')} hint="0 = unlimited" />
        <label className="flex items-center gap-2 text-sm text-txt-primary cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="rounded border-surface-border text-primary focus:ring-primary" /> Active
        </label>
      </form>
    </Drawer>
  )
}
