import { useState } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface SaleItem {
  id: number; product_id: number; product_name: string; quantity: number; unit_price: number; line_total: number
}

interface Props {
  open: boolean
  saleId: number
  items: SaleItem[]
  currency: string
  onClose: (returned?: boolean) => void
}

export function SaleReturn({ open, saleId, items, currency, onClose }: Props) {
  const { user } = useAuthStore()
  const [returnItems, setReturnItems] = useState<Record<number, number>>({})
  const [reason, setReason] = useState('')
  const [refundMethod, setRefundMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)

  const setReturnQty = (itemId: number, qty: number, max: number) => {
    if (qty <= 0) {
      const copy = { ...returnItems }
      delete copy[itemId]
      setReturnItems(copy)
    } else {
      setReturnItems({ ...returnItems, [itemId]: Math.min(qty, max) })
    }
  }

  const selectedItems = items.filter((i) => returnItems[i.id] && returnItems[i.id] > 0)
  const totalRefund = selectedItems.reduce((sum, i) => sum + (i.unit_price * (returnItems[i.id] || 0)), 0)

  const handleReturn = async () => {
    if (selectedItems.length === 0) { toast.error('Select at least one item to return'); return }
    if (!reason.trim()) { toast.error('Please provide a reason'); return }

    setProcessing(true)
    const r = await window.api.invoke('sales:return', {
      original_sale_id: saleId,
      return_reason: reason,
      refund_method: refundMethod,
      created_by: user?.id,
      items: selectedItems.map((i) => ({
        sale_item_id: i.id, product_id: i.product_id, product_name: i.product_name,
        quantity: returnItems[i.id], unit_price: i.unit_price, line_total: i.unit_price * returnItems[i.id]
      }))
    })

    if (r.success) {
      toast.success(`Return ${r.returnNumber} processed. Refund: ${formatCurrency(r.totalAmount, currency)}`)
      onClose(true)
    } else {
      toast.error(r.error || 'Failed')
    }
    setProcessing(false)
  }

  return (
    <Modal open={open} onClose={() => onClose()} title="Sale Return" size="lg"
      footer={<><Button variant="secondary" onClick={() => onClose()}>Cancel</Button><Button variant="danger" loading={processing} onClick={handleReturn}>Process Return</Button></>}>
      <div className="space-y-5">
        <p className="text-sm text-txt-secondary">Select items and quantities to return:</p>

        <div className="border border-surface-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-surface-border">
              <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Product</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-txt-muted uppercase">Sold</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-txt-muted uppercase">Return Qty</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Refund</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-surface-border last:border-0">
                  <td className="px-3 py-2.5 font-medium text-txt-primary">{item.product_name}</td>
                  <td className="px-3 py-2.5 text-center font-mono">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-center">
                    <input type="number" min="0" max={item.quantity} value={returnItems[item.id] || ''}
                      onChange={(e) => setReturnQty(item.id, Number(e.target.value), item.quantity)}
                      placeholder="0"
                      className="w-16 text-center text-sm border border-surface-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {returnItems[item.id] ? formatCurrency(item.unit_price * returnItems[item.id], currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalRefund > 0 && (
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-xs text-txt-muted">Total Refund</p>
            <p className="text-2xl font-heading font-bold text-danger">{formatCurrency(totalRefund, currency)}</p>
          </div>
        )}

        <Textarea label="Reason for Return *" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Defective product, wrong item, customer changed mind..." rows={2} />

        <Select label="Refund Method" options={[
          { value: 'cash', label: 'Cash Refund' }, { value: 'account_credit', label: 'Add to Customer Credit' }
        ]} value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} />
      </div>
    </Modal>
  )
}
