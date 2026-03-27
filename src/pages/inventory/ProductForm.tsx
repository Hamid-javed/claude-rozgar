import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select, Button } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { useProfileStore } from '@/store/profileStore'
import { useAuthStore } from '@/store/authStore'
import { Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  description: z.string().optional(),
  buy_price: z.string().optional(),
  sale_price: z.string().optional(),
  min_sale_price: z.string().optional(),
  wholesale_price: z.string().optional(),
  tax_percent: z.string().optional(),
  track_stock: z.boolean(),
  current_stock: z.string().optional(),
  min_stock_alert: z.string().optional(),
  max_stock: z.string().optional(),
  expiry_date: z.string().optional(),
  batch_number: z.string().optional(),
  manufacturer: z.string().optional(),
  serial_number: z.string().optional(),
  is_active: z.boolean(),
  notes: z.string().optional()
})

type ProductFormData = z.infer<typeof productSchema>

interface Category { id: number; name: string }
interface Unit { id: number; name: string; abbreviation: string }

interface Props {
  open: boolean
  productId: number | null
  categories: Category[]
  onClose: (saved?: boolean) => void
}

export function ProductForm({ open, productId, categories, onClose }: Props) {
  const { profile } = useProfileStore()
  const { user } = useAuthStore()
  const isEdit = productId !== null
  const [units, setUnits] = useState<Unit[]>([])
  const [saving, setSaving] = useState(false)

  const businessType = profile?.type || ''
  const showExpiry = ['medical', 'general_store'].includes(businessType)
  const showBatch = ['medical'].includes(businessType)
  const showManufacturer = ['medical'].includes(businessType)
  const showSerial = ['electronics'].includes(businessType)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      track_stock: true,
      is_active: true,
      buy_price: '0',
      sale_price: '0',
      min_stock_alert: '5',
      current_stock: '0'
    }
  })

  useEffect(() => {
    const loadUnits = async () => {
      const result = await window.api.invoke('units:list')
      if (result.success) setUnits(result.data)
    }
    loadUnits()
  }, [])

  useEffect(() => {
    if (!open) return
    if (isEdit && productId) {
      const loadProduct = async () => {
        const result = await window.api.invoke('products:get', { id: productId })
        if (result.success && result.data) {
          const p = result.data
          reset({
            name: p.name,
            sku: p.sku || '',
            barcode: p.barcode || '',
            category_id: p.category_id ? String(p.category_id) : '',
            unit_id: p.unit_id ? String(p.unit_id) : '',
            description: p.description || '',
            buy_price: String(p.buy_price),
            sale_price: String(p.sale_price),
            min_sale_price: String(p.min_sale_price || 0),
            wholesale_price: String(p.wholesale_price || 0),
            tax_percent: String(p.tax_percent || 0),
            track_stock: !!p.track_stock,
            current_stock: String(p.current_stock),
            min_stock_alert: String(p.min_stock_alert),
            max_stock: String(p.max_stock || 0),
            expiry_date: p.expiry_date || '',
            batch_number: p.batch_number || '',
            manufacturer: p.manufacturer || '',
            serial_number: p.serial_number || '',
            is_active: !!p.is_active,
            notes: p.notes || ''
          })
        }
      }
      loadProduct()
    } else {
      reset({
        name: '', sku: '', barcode: '', category_id: '', unit_id: '',
        description: '', buy_price: '0', sale_price: '0', min_sale_price: '0',
        wholesale_price: '0', tax_percent: '0', track_stock: true,
        current_stock: '0', min_stock_alert: '5', max_stock: '0',
        expiry_date: '', batch_number: '', manufacturer: '',
        serial_number: '', is_active: true, notes: ''
      })
    }
  }, [open, productId, isEdit, reset])

  const generateSku = async () => {
    const result = await window.api.invoke('products:generate-sku')
    if (result.success) setValue('sku', result.sku)
  }

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: data.name,
      sku: data.sku || null,
      barcode: data.barcode || null,
      category_id: data.category_id ? Number(data.category_id) : null,
      unit_id: data.unit_id ? Number(data.unit_id) : null,
      description: data.description || null,
      buy_price: Number(data.buy_price) || 0,
      sale_price: Number(data.sale_price) || 0,
      min_sale_price: Number(data.min_sale_price) || 0,
      wholesale_price: Number(data.wholesale_price) || 0,
      tax_percent: Number(data.tax_percent) || 0,
      track_stock: data.track_stock ? 1 : 0,
      current_stock: Number(data.current_stock) || 0,
      min_stock_alert: Number(data.min_stock_alert) || 5,
      max_stock: Number(data.max_stock) || 0,
      expiry_date: data.expiry_date || null,
      batch_number: data.batch_number || null,
      manufacturer: data.manufacturer || null,
      serial_number: data.serial_number || null,
      is_active: data.is_active ? 1 : 0,
      notes: data.notes || null
    }

    let result
    if (isEdit) {
      result = await window.api.invoke('products:update', { id: productId, data: payload })
    } else {
      payload.created_by = user?.id
      result = await window.api.invoke('products:create', payload)
    }

    if (result.success) {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onClose(true)
    } else {
      toast.error(result.error || 'Failed to save product')
    }
    setSaving(false)
  }

  const productLabel = profile?.custom_labels?.['Product'] || 'Product'

  return (
    <Drawer
      open={open}
      onClose={() => onClose()}
      title={isEdit ? `Edit ${productLabel}` : `Add ${productLabel}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose()}>Cancel</Button>
          <Button loading={saving} onClick={handleSubmit(onSubmit)}>
            {isEdit ? 'Update' : 'Create'} {productLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <section>
          <h3 className="text-sm font-semibold text-txt-primary mb-3 uppercase tracking-wide">Basic Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Name *" {...register('name')} error={errors.name?.message} placeholder="Product name" />
            </div>
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input label="SKU" {...register('sku')} placeholder="Auto-generated" />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={generateSku} title="Generate SKU">
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Input label="Barcode" {...register('barcode')} placeholder="Scan or type" />
            <Select
              label="Category"
              {...register('category_id')}
              placeholder="Select category"
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            />
            <Select
              label="Unit"
              {...register('unit_id')}
              placeholder="Select unit"
              options={units.map((u) => ({ value: String(u.id), label: `${u.name} (${u.abbreviation})` }))}
            />
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h3 className="text-sm font-semibold text-txt-primary mb-3 uppercase tracking-wide">Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Buy Price" type="number" step="0.01" {...register('buy_price')} />
            <Input label="Sale Price" type="number" step="0.01" {...register('sale_price')} />
            <Input label="Wholesale Price" type="number" step="0.01" {...register('wholesale_price')} />
            <Input label="Min Sale Price" type="number" step="0.01" {...register('min_sale_price')} hint="Floor price to prevent under-selling" />
            <Input label="Tax %" type="number" step="0.01" {...register('tax_percent')} />
          </div>
        </section>

        {/* Stock */}
        <section>
          <h3 className="text-sm font-semibold text-txt-primary mb-3 uppercase tracking-wide">
            {profile?.custom_labels?.['Stock'] || 'Stock'}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-txt-primary cursor-pointer">
              <input type="checkbox" {...register('track_stock')} className="rounded border-surface-border text-primary focus:ring-primary" />
              Track stock for this product
            </label>
            <div className="grid grid-cols-3 gap-4">
              {!isEdit && (
                <Input label="Opening Stock" type="number" step="0.01" {...register('current_stock')} />
              )}
              <Input label="Min Stock Alert" type="number" step="0.01" {...register('min_stock_alert')} />
              <Input label="Max Stock" type="number" step="0.01" {...register('max_stock')} />
            </div>
          </div>
        </section>

        {/* Business-type-specific fields */}
        {(showExpiry || showBatch || showManufacturer || showSerial) && (
          <section>
            <h3 className="text-sm font-semibold text-txt-primary mb-3 uppercase tracking-wide">Additional Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {showExpiry && <Input label="Expiry Date" type="date" {...register('expiry_date')} />}
              {showBatch && <Input label="Batch Number" {...register('batch_number')} />}
              {showManufacturer && <Input label="Manufacturer" {...register('manufacturer')} />}
              {showSerial && <Input label="Serial Number" {...register('serial_number')} />}
            </div>
          </section>
        )}

        {/* Notes & Status */}
        <section>
          <div className="space-y-4">
            <Textarea label="Notes" {...register('notes')} rows={3} placeholder="Optional notes..." />
            <label className="flex items-center gap-2 text-sm text-txt-primary cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="rounded border-surface-border text-primary focus:ring-primary" />
              Active (available for sale)
            </label>
          </div>
        </section>
      </form>
    </Drawer>
  )
}
