import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge, Button } from '@/components/ui'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import { Printer, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface SaleItem {
  id: number
  product_name: string
  product_sku: string | null
  quantity: number
  unit_price: number
  buy_price: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  line_total: number
}

interface SaleData {
  id: number
  invoice_number: string
  sale_date: string
  customer_name: string | null
  sale_type: string
  subtotal: number
  discount_type: string | null
  discount_value: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  amount_paid: number
  amount_due: number
  payment_method: string
  status: string
  notes: string | null
  created_at: string
  items: SaleItem[]
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  paid: 'success', partial: 'warning', credit: 'danger', cancelled: 'default', returned: 'info'
}

interface Props {
  open: boolean
  saleId: number
  currency: string
  onClose: () => void
}

export function SaleDetail({ open, saleId, currency, onClose }: Props) {
  const [sale, setSale] = useState<SaleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !saleId) return
    setLoading(true)
    const load = async () => {
      const result = await window.api.invoke('sales:get', { id: saleId })
      if (result.success) setSale(result.data)
      setLoading(false)
    }
    load()
  }, [open, saleId])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Sale Detail"
      size="lg"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => toast('Print coming in Phase 5')}>
            Print
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !sale ? (
        <p className="text-center text-txt-muted py-10">Sale not found</p>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-primary font-mono">{sale.invoice_number}</h3>
              <p className="text-sm text-txt-secondary mt-0.5">{formatDateTime(sale.created_at)}</p>
            </div>
            <Badge variant={statusVariant[sale.status] || 'default'}>{sale.status}</Badge>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Customer" value={sale.customer_name || 'Walk-in'} />
            <InfoCard label="Payment" value={sale.payment_method.replace('_', ' ')} />
            <InfoCard label="Sale Type" value={sale.sale_type} />
          </div>

          {/* Items table */}
          <div>
            <h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Items</h4>
            <div className="border border-surface-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-surface-border">
                    <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Product</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-txt-muted uppercase">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Total</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => {
                    const profit = item.line_total - (item.buy_price * item.quantity)
                    return (
                      <tr key={item.id} className="border-b border-surface-border last:border-0">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-txt-primary">{item.product_name}</p>
                          {item.product_sku && <p className="text-xs text-txt-muted font-mono">{item.product_sku}</p>}
                        </td>
                        <td className="text-center px-3 py-2.5 font-mono">{item.quantity}</td>
                        <td className="text-right px-3 py-2.5 font-mono">{formatCurrency(item.unit_price, currency)}</td>
                        <td className="text-right px-3 py-2.5 font-mono font-medium">{formatCurrency(item.line_total, currency)}</td>
                        <td className={`text-right px-3 py-2.5 font-mono font-medium ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(profit, currency)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <TotalRow label="Subtotal" value={formatCurrency(sale.subtotal, currency)} />
            {sale.discount_amount > 0 && (
              <TotalRow label={`Discount${sale.discount_type === 'percent' ? ` (${sale.discount_value}%)` : ''}`} value={`-${formatCurrency(sale.discount_amount, currency)}`} className="text-warning" />
            )}
            {sale.tax_amount > 0 && (
              <TotalRow label="Tax" value={formatCurrency(sale.tax_amount, currency)} />
            )}
            <div className="border-t border-surface-border pt-2">
              <TotalRow label="Grand Total" value={formatCurrency(sale.grand_total, currency)} className="text-lg font-bold" />
            </div>
            <div className="border-t border-surface-border pt-2 space-y-1">
              <TotalRow label="Paid" value={formatCurrency(sale.amount_paid, currency)} className="text-success" />
              {sale.amount_due > 0 && (
                <TotalRow label="Balance Due" value={formatCurrency(sale.amount_due, currency)} className="text-danger font-semibold" />
              )}
            </div>

            {/* Profit summary */}
            <div className="border-t border-surface-border pt-2">
              <TotalRow
                label="Total Profit"
                value={formatCurrency(
                  sale.items.reduce((sum, i) => sum + i.line_total - (i.buy_price * i.quantity), 0),
                  currency
                )}
                className="text-success font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-txt-muted mb-1">Notes</p>
              <p className="text-sm text-txt-primary">{sale.notes}</p>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-txt-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-txt-primary capitalize">{value}</p>
    </div>
  )
}

function TotalRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between text-sm ${className || 'text-txt-secondary'}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
