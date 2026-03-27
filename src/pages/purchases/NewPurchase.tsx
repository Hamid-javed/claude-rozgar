import { useState, useEffect } from 'react'
import { PageHeader, Button, Input, Select, Card, CardHeader } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { Plus, Trash2, Search, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface PurchaseItem {
  product_id: number
  product_name: string
  quantity: number
  unit_cost: number
  tax_percent: number
  tax_amount: number
  line_total: number
  expiry_date: string
  batch_number: string
}

interface Supplier { id: number; name: string; company: string | null }
interface Product { id: number; name: string; sku: string | null; buy_price: number }

export default function NewPurchase() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const navigate = useNavigate()
  const currency = profile?.currency_symbol || 'Rs.'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [invoiceRef, setInvoiceRef] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')

  const [items, setItems] = useState<PurchaseItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)

  // Load suppliers
  useEffect(() => {
    window.api.invoke('suppliers:list').then((r: any) => {
      if (r.success) setSuppliers(r.data || [])
    })
  }, [])

  // Product search
  useEffect(() => {
    if (!productSearch) { setProductResults([]); return }
    const t = setTimeout(async () => {
      const r = await window.api.invoke('products:search', { query: productSearch, limit: 8 })
      if (r.success) setProductResults(r.data)
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  const addProduct = (product: Product) => {
    if (items.find((i) => i.product_id === product.id)) {
      setItems(items.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_cost } : i))
    } else {
      setItems([...items, {
        product_id: product.id, product_name: product.name,
        quantity: 1, unit_cost: product.buy_price,
        tax_percent: 0, tax_amount: 0,
        line_total: product.buy_price,
        expiry_date: '', batch_number: ''
      }])
    }
    setProductSearch('')
    setProductResults([])
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      // Recalculate line total
      const subtotal = updated.quantity * updated.unit_cost
      const taxAmt = updated.tax_percent > 0 ? subtotal * (updated.tax_percent / 100) : 0
      updated.tax_amount = Math.round(taxAmt * 100) / 100
      updated.line_total = Math.round((subtotal + taxAmt) * 100) / 100
      return updated
    }))
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
  const taxTotal = items.reduce((sum, i) => sum + i.tax_amount, 0)
  const discount = Number(discountAmount) || 0
  const shipping = Number(shippingCost) || 0
  const grandTotal = Math.round((subtotal - discount + shipping) * 100) / 100
  const paid = Number(amountPaid) || 0
  const amountDue = Math.max(0, grandTotal - paid)

  const handleSave = async () => {
    if (items.length === 0) { toast.error('Add at least one item'); return }

    setSaving(true)
    const selectedSupplier = suppliers.find((s) => String(s.id) === supplierId)

    const result = await window.api.invoke('purchases:create', {
      supplier_id: supplierId ? Number(supplierId) : null,
      supplier_name: selectedSupplier?.name || supplierName || null,
      subtotal,
      discount_amount: discount,
      tax_amount: taxTotal,
      shipping_cost: shipping,
      grand_total: grandTotal,
      amount_paid: paid,
      amount_due: amountDue,
      payment_method: paymentMethod,
      status: amountDue <= 0 ? 'received' : 'partial',
      invoice_ref: invoiceRef || null,
      notes: notes || null,
      created_by: user?.id,
      items: items.map((i) => ({
        product_id: i.product_id, product_name: i.product_name,
        quantity: i.quantity, unit_cost: i.unit_cost,
        tax_percent: i.tax_percent, tax_amount: i.tax_amount,
        line_total: i.line_total,
        expiry_date: i.expiry_date || null, batch_number: i.batch_number || null
      }))
    })

    if (result.success) {
      toast.success(`Purchase ${result.purchaseNumber} created`)
      navigate('/purchases')
    } else {
      toast.error(result.error || 'Failed to create purchase')
    }
    setSaving(false)
  }

  const showBatch = profile?.type === 'medical'

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="New Purchase"
        subtitle="Record a purchase from a supplier"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/purchases')}>Cancel</Button>
            <Button loading={saving} icon={<Save className="w-4 h-4" />} onClick={handleSave}>Save Purchase</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <Card>
            <CardHeader title="Items" />
            <div className="relative mb-4">
              <Input
                placeholder="Search products to add..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              {productResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {productResults.map((p) => (
                    <button key={p.id} type="button" onClick={() => addProduct(p)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-surface-border last:border-0">
                      <p className="text-sm font-medium text-txt-primary">{p.name}</p>
                      <p className="text-xs text-txt-muted">{p.sku && <span className="font-mono">{p.sku} · </span>}Cost: {formatCurrency(p.buy_price, currency)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items table */}
            {items.length === 0 ? (
              <p className="text-center text-sm text-txt-muted py-8">Search and add products above</p>
            ) : (
              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-surface-border">
                      <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Product</th>
                      <th className="text-center px-2 py-2 text-xs font-medium text-txt-muted uppercase w-20">Qty</th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-txt-muted uppercase w-28">Unit Cost</th>
                      <th className="text-right px-2 py-2 text-xs font-medium text-txt-muted uppercase w-16">Tax%</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={item.product_id} className="border-b border-surface-border last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-medium text-txt-primary text-sm">{item.product_name}</p>
                          {showBatch && (
                            <div className="flex gap-2 mt-1">
                              <input placeholder="Batch#" value={item.batch_number} onChange={(e) => updateItem(i, 'batch_number', e.target.value)}
                                className="w-24 text-xs border border-surface-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                              <input type="date" value={item.expiry_date} onChange={(e) => updateItem(i, 'expiry_date', e.target.value)}
                                className="w-32 text-xs border border-surface-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="1" value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 1)}
                            className="w-full text-center text-sm border border-surface-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" step="0.01" value={item.unit_cost}
                            onChange={(e) => updateItem(i, 'unit_cost', Number(e.target.value) || 0)}
                            className="w-full text-right text-sm font-mono border border-surface-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" step="0.01" value={item.tax_percent}
                            onChange={(e) => updateItem(i, 'tax_percent', Number(e.target.value) || 0)}
                            className="w-full text-right text-sm border border-surface-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-sm">{formatCurrency(item.line_total, currency)}</td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeItem(i)} className="p-1 rounded text-txt-muted hover:text-danger hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Details & Totals */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Supplier" />
            {suppliers.length > 0 ? (
              <Select
                placeholder="Select supplier"
                options={suppliers.map((s) => ({ value: String(s.id), label: `${s.name}${s.company ? ` (${s.company})` : ''}` }))}
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              />
            ) : (
              <Input placeholder="Supplier name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            )}
            <div className="mt-3">
              <Input label="Supplier Invoice #" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="Optional" />
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment" />
            <div className="space-y-3">
              <Select label="Payment Method" options={[
                { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'credit', label: 'Credit' }
              ]} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              <Input label="Amount Paid" type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
              <Input label="Discount" type="number" step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0" />
              <Input label="Shipping Cost" type="number" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0" />
            </div>
          </Card>

          <Card>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-txt-secondary"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal, currency)}</span></div>
              {discount > 0 && <div className="flex justify-between text-warning"><span>Discount</span><span className="font-mono">-{formatCurrency(discount, currency)}</span></div>}
              {taxTotal > 0 && <div className="flex justify-between text-txt-secondary"><span>Tax</span><span className="font-mono">{formatCurrency(taxTotal, currency)}</span></div>}
              {shipping > 0 && <div className="flex justify-between text-txt-secondary"><span>Shipping</span><span className="font-mono">{formatCurrency(shipping, currency)}</span></div>}
              <div className="border-t border-surface-border pt-2 flex justify-between text-lg font-bold text-txt-primary">
                <span>Total</span><span className="font-mono">{formatCurrency(grandTotal, currency)}</span>
              </div>
              {paid > 0 && <div className="flex justify-between text-success"><span>Paid</span><span className="font-mono">{formatCurrency(paid, currency)}</span></div>}
              {amountDue > 0 && <div className="flex justify-between text-danger font-semibold"><span>Due</span><span className="font-mono">{formatCurrency(amountDue, currency)}</span></div>}
            </div>
          </Card>

          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={3} />
        </div>
      </div>
    </div>
  )
}
