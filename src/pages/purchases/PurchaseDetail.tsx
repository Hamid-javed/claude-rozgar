import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge, Button } from '@/components/ui'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import { Printer } from 'lucide-react'
import toast from 'react-hot-toast'

interface PurchaseItem {
  id: number; product_name: string; quantity: number; unit_cost: number
  tax_percent: number; tax_amount: number; line_total: number
  expiry_date: string | null; batch_number: string | null
}
interface PurchaseData {
  id: number; purchase_number: string; purchase_date: string
  supplier_name: string | null; subtotal: number; discount_amount: number
  tax_amount: number; shipping_cost: number; grand_total: number
  amount_paid: number; amount_due: number; payment_method: string
  status: string; invoice_ref: string | null; notes: string | null
  created_at: string; items: PurchaseItem[]
}

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  received: 'success', partial: 'warning', ordered: 'info', cancelled: 'default'
}

interface Props { open: boolean; purchaseId: number; currency: string; onClose: () => void }

export function PurchaseDetail({ open, purchaseId, currency, onClose }: Props) {
  const [data, setData] = useState<PurchaseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    window.api.invoke('purchases:get', { id: purchaseId }).then((r: any) => {
      if (r.success) setData(r.data)
      setLoading(false)
    })
  }, [open, purchaseId])

  return (
    <Drawer open={open} onClose={onClose} title="Purchase Detail" size="lg"
      footer={<>
        <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => toast('Print coming in Phase 5')}>Print</Button>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </>}>
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : !data ? (
        <p className="text-center text-txt-muted py-10">Purchase not found</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-primary font-mono">{data.purchase_number}</h3>
              <p className="text-sm text-txt-secondary mt-0.5">{formatDateTime(data.created_at)}</p>
            </div>
            <Badge variant={statusVariant[data.status] || 'default'}>{data.status}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Supplier" value={data.supplier_name || '—'} />
            <InfoCard label="Payment" value={data.payment_method.replace('_', ' ')} />
            {data.invoice_ref && <InfoCard label="Supplier Inv#" value={data.invoice_ref} />}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Items</h4>
            <div className="border border-surface-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-surface-border">
                    <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Product</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-txt-muted uppercase">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Unit Cost</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b border-surface-border last:border-0">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-txt-primary">{item.product_name}</p>
                        {(item.batch_number || item.expiry_date) && (
                          <p className="text-xs text-txt-muted">
                            {item.batch_number && `Batch: ${item.batch_number}`}
                            {item.batch_number && item.expiry_date && ' · '}
                            {item.expiry_date && `Exp: ${formatDate(item.expiry_date)}`}
                          </p>
                        )}
                      </td>
                      <td className="text-center px-3 py-2.5 font-mono">{item.quantity}</td>
                      <td className="text-right px-3 py-2.5 font-mono">{formatCurrency(item.unit_cost, currency)}</td>
                      <td className="text-right px-3 py-2.5 font-mono font-medium">{formatCurrency(item.line_total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <TotalRow label="Subtotal" value={formatCurrency(data.subtotal, currency)} />
            {data.discount_amount > 0 && <TotalRow label="Discount" value={`-${formatCurrency(data.discount_amount, currency)}`} className="text-warning" />}
            {data.tax_amount > 0 && <TotalRow label="Tax" value={formatCurrency(data.tax_amount, currency)} />}
            {data.shipping_cost > 0 && <TotalRow label="Shipping" value={formatCurrency(data.shipping_cost, currency)} />}
            <div className="border-t border-surface-border pt-2">
              <TotalRow label="Grand Total" value={formatCurrency(data.grand_total, currency)} className="text-lg font-bold" />
            </div>
            <div className="border-t border-surface-border pt-2 space-y-1">
              <TotalRow label="Paid" value={formatCurrency(data.amount_paid, currency)} className="text-success" />
              {data.amount_due > 0 && <TotalRow label="Balance Due" value={formatCurrency(data.amount_due, currency)} className="text-danger font-semibold" />}
            </div>
          </div>

          {data.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-txt-muted mb-1">Notes</p>
              <p className="text-sm text-txt-primary">{data.notes}</p>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (<div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-txt-muted mb-0.5">{label}</p><p className="text-sm font-medium text-txt-primary capitalize">{value}</p></div>)
}
function TotalRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (<div className={`flex justify-between text-sm ${className || 'text-txt-secondary'}`}><span>{label}</span><span className="font-mono">{value}</span></div>)
}
