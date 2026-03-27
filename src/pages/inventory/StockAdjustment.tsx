import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader, Button, Input, Select, Card } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { PackagePlus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  product_id: z.string().min(1, 'Select a product'),
  type: z.enum(['add', 'remove', 'set']),
  quantity: z.string().min(1, 'Quantity is required'),
  reason: z.string().min(1, 'Reason is required')
})

type FormData = z.infer<typeof schema>

interface Product { id: number; name: string; sku: string | null; current_stock: number }

export default function StockAdjustment() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'add', quantity: '', reason: '' }
  })

  const adjustType = watch('type')

  // Search products
  useEffect(() => {
    if (!searchQuery) { setProducts([]); return }
    const timer = setTimeout(async () => {
      const result = await window.api.invoke('products:search', { query: searchQuery, limit: 10 })
      if (result.success) setProducts(result.data)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setValue('product_id', String(product.id))
    setSearchQuery('')
    setProducts([])
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const result = await window.api.invoke('products:adjust-stock', {
      id: Number(data.product_id),
      type: data.type,
      quantity: Number(data.quantity),
      reason: data.reason,
      userId: user?.id
    })

    if (result.success) {
      toast.success(`Stock adjusted. New stock: ${result.current_stock}`)
      setSelectedProduct(null)
      reset({ type: 'add', quantity: '', reason: '', product_id: '' })
    } else {
      toast.error(result.error || 'Failed to adjust stock')
    }
    setSaving(false)
  }

  const stockLabel = profile?.custom_labels?.['Stock'] || 'Stock'

  return (
    <div className="p-6 space-y-5">
      <PageHeader title={`${stockLabel} Adjustment`} subtitle="Add, remove, or set exact stock quantities" />

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Product Search */}
            <div>
              <label className="block text-sm font-medium text-txt-primary mb-1">Product *</label>
              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 bg-primary-light rounded-lg border border-primary/20">
                  <div>
                    <p className="text-sm font-medium text-txt-primary">{selectedProduct.name}</p>
                    <p className="text-xs text-txt-muted">
                      {selectedProduct.sku && <span className="font-mono">{selectedProduct.sku} · </span>}
                      Current stock: <span className="font-semibold">{selectedProduct.current_stock}</span>
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setValue('product_id', '') }}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search product by name, SKU, barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    error={errors.product_id?.message}
                  />
                  <input type="hidden" {...register('product_id')} />
                  {products.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {products.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(p)}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-surface-border last:border-0"
                        >
                          <p className="text-sm font-medium text-txt-primary">{p.name}</p>
                          <p className="text-xs text-txt-muted">
                            {p.sku && <span className="font-mono">{p.sku} · </span>}
                            Stock: {p.current_stock}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Adjustment Type */}
            <Select
              label="Adjustment Type *"
              {...register('type')}
              options={[
                { value: 'add', label: 'Add Stock (+)' },
                { value: 'remove', label: 'Remove Stock (-)' },
                { value: 'set', label: 'Set Exact Quantity' }
              ]}
            />

            {/* Quantity */}
            <Input
              label={adjustType === 'set' ? 'New Stock Quantity *' : 'Quantity *'}
              type="number"
              step="0.01"
              min="0"
              {...register('quantity')}
              error={errors.quantity?.message}
              hint={selectedProduct && adjustType !== 'set'
                ? `Current: ${selectedProduct.current_stock} → New: ${
                    adjustType === 'add'
                      ? selectedProduct.current_stock + (Number(watch('quantity')) || 0)
                      : selectedProduct.current_stock - (Number(watch('quantity')) || 0)
                  }`
                : undefined
              }
            />

            {/* Reason */}
            <Textarea
              label="Reason *"
              {...register('reason')}
              error={errors.reason?.message}
              placeholder="e.g., Damaged goods, Physical count correction, New shipment received..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setSelectedProduct(null); reset() }}>
                Clear
              </Button>
              <Button type="submit" loading={saving} icon={<PackagePlus className="w-4 h-4" />}>
                Adjust Stock
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
