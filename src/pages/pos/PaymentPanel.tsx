import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatters'
import {
  Banknote, CreditCard, Building2, Receipt,
  CheckCircle, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  currency: string
  onSaleComplete: () => void
}

type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'credit'

const paymentMethods: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: 'cash', label: 'Cash', icon: <Banknote className="w-5 h-5" /> },
  { key: 'card', label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
  { key: 'bank_transfer', label: 'Bank', icon: <Building2 className="w-5 h-5" /> },
  { key: 'credit', label: 'Credit', icon: <Receipt className="w-5 h-5" /> }
]

export function PaymentPanel({ open, onClose, currency, onSaleComplete }: Props) {
  const { user } = useAuthStore()
  const {
    items, customer_id, customer_name, sale_type,
    discount_type, discount_value,
    notes, getSubtotal, getDiscountAmount, getGrandTotal, clearCart
  } = useCartStore()

  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')

  const grandTotal = getGrandTotal()
  const cashAmount = Number(cashReceived) || 0
  const change = method === 'cash' ? Math.max(0, cashAmount - grandTotal) : 0

  const handleComplete = async () => {
    if (items.length === 0) return
    if (method === 'cash' && cashAmount < grandTotal) {
      toast.error('Cash received is less than total')
      return
    }

    setProcessing(true)

    const subtotal = getSubtotal()
    const discountAmount = getDiscountAmount()
    const amountPaid = method === 'credit' ? 0 : grandTotal
    const amountDue = method === 'credit' ? grandTotal : 0

    const saleData = {
      customer_id: customer_id || null,
      customer_name: customer_name || 'Walk-in Customer',
      sale_type,
      subtotal,
      discount_type: discount_type || null,
      discount_value: discount_value || 0,
      discount_amount: discountAmount,
      tax_amount: items.reduce((sum, i) => sum + i.tax_amount, 0),
      grand_total: grandTotal,
      amount_paid: amountPaid,
      amount_due: amountDue,
      payment_method: method,
      payment_details: method === 'cash' ? JSON.stringify({ received: cashAmount, change }) : '{}',
      status: method === 'credit' ? 'credit' : amountDue > 0 ? 'partial' : 'paid',
      notes: notes || null,
      created_by: user?.id || null,
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        buy_price: item.buy_price,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        tax_percent: item.tax_percent,
        tax_amount: item.tax_amount,
        line_total: item.line_total
      }))
    }

    const result = await window.api.invoke('sales:create', saleData)

    if (result.success) {
      setInvoiceNumber(result.invoiceNumber)
      setCompleted(true)
      toast.success('Sale completed!')
    } else {
      toast.error(result.error || 'Failed to complete sale')
    }
    setProcessing(false)
  }

  const handleNewSale = () => {
    clearCart()
    setCompleted(false)
    setInvoiceNumber('')
    setCashReceived('')
    setMethod('cash')
    onSaleComplete()
  }

  const handleClose = () => {
    if (completed) handleNewSale()
    else onClose()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={handleClose} size="md" title={completed ? undefined : 'Complete Sale'}>
      {completed ? (
        /* Success Screen */
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-heading font-bold text-txt-primary mb-1">Sale Complete!</h2>
          <p className="text-sm text-txt-secondary mb-1">Invoice: <span className="font-mono font-medium">{invoiceNumber}</span></p>
          <p className="text-2xl font-heading font-bold text-primary mt-2">
            {formatCurrency(grandTotal, currency)}
          </p>
          {method === 'cash' && change > 0 && (
            <p className="text-sm text-success mt-2 font-medium">
              Change: {formatCurrency(change, currency)}
            </p>
          )}

          <div className="flex items-center gap-3 mt-8">
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => toast('Print coming in Phase 5')}>
              Print Receipt
            </Button>
            <Button onClick={handleNewSale}>
              New Sale
            </Button>
          </div>
        </div>
      ) : (
        /* Payment Form */
        <div className="space-y-6">
          {/* Amount Due */}
          <div className="text-center py-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Amount Due</p>
            <p className="text-3xl font-heading font-bold text-primary">
              {formatCurrency(grandTotal, currency)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium text-txt-secondary mb-2">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.key}
                  onClick={() => setMethod(pm.key)}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                    ${method === pm.key
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-surface-border text-txt-secondary hover:border-primary/30'
                    }
                  `}
                >
                  {pm.icon}
                  <span className="text-xs font-medium">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Calculator */}
          {method === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-txt-secondary block mb-1">Cash Received</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full h-14 text-2xl font-heading font-bold text-center rounded-xl border-2 border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              {/* Quick cash buttons */}
              <div className="flex gap-2">
                {[Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000]
                  .filter((v, i, arr) => v >= grandTotal && arr.indexOf(v) === i)
                  .slice(0, 3)
                  .map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCashReceived(String(amount))}
                      className="flex-1 py-2 rounded-lg bg-gray-100 text-sm font-medium text-txt-secondary hover:bg-gray-200 transition-colors"
                    >
                      {formatCurrency(amount, currency)}
                    </button>
                  ))}
              </div>
              {cashAmount >= grandTotal && (
                <div className="text-center py-3 bg-green-50 rounded-xl">
                  <p className="text-xs text-txt-muted mb-0.5">Change</p>
                  <p className="text-xl font-heading font-bold text-success">
                    {formatCurrency(change, currency)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Credit warning */}
          {method === 'credit' && !customer_id && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Credit sales require a customer. The sale will be recorded for "Walk-in Customer".
            </div>
          )}

          {/* Complete button */}
          <Button
            className="w-full h-12 text-base font-semibold"
            loading={processing}
            onClick={handleComplete}
            disabled={method === 'cash' && cashAmount < grandTotal}
          >
            Complete Sale
          </Button>
        </div>
      )}
    </Modal>
  )
}
