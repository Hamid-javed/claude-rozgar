import { formatCurrency, formatDate } from '@/utils/formatters'

interface SaleItem {
  product_name: string; quantity: number; unit_price: number; line_total: number
}

interface ReceiptData {
  invoice_number: string; sale_date: string; customer_name: string | null
  subtotal: number; discount_amount: number; tax_amount: number
  grand_total: number; amount_paid: number; amount_due: number
  payment_method: string; items: SaleItem[]
}

interface BusinessInfo {
  name: string; address?: string | null; phone?: string | null; currency_symbol: string
  receipt_footer?: string | null
}

interface Props { sale: ReceiptData; business: BusinessInfo }

export function ReceiptThermal({ sale, business }: Props) {
  const c = business.currency_symbol

  return (
    <div className="receipt-thermal mx-auto bg-white text-gray-800" style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px', padding: '8mm' }}>
      {/* Header */}
      <div className="text-center mb-3">
        <p className="text-base font-bold">{business.name}</p>
        {business.address && <p className="text-xs">{business.address}</p>}
        {business.phone && <p className="text-xs">{business.phone}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Invoice info */}
      <div className="text-xs mb-2">
        <div className="flex justify-between"><span>Invoice:</span><span>{sale.invoice_number}</span></div>
        <div className="flex justify-between"><span>Date:</span><span>{formatDate(sale.sale_date)}</span></div>
        {sale.customer_name && <div className="flex justify-between"><span>Customer:</span><span>{sale.customer_name}</span></div>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Items */}
      <div className="mb-2">
        {sale.items.map((item, i) => (
          <div key={i} className="mb-1">
            <p className="text-xs font-medium truncate">{item.product_name}</p>
            <div className="flex justify-between text-xs">
              <span>{item.quantity} x {formatCurrency(item.unit_price, c)}</span>
              <span>{formatCurrency(item.line_total, c)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Totals */}
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(sale.subtotal, c)}</span></div>
        {sale.discount_amount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(sale.discount_amount, c)}</span></div>}
        {sale.tax_amount > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(sale.tax_amount, c)}</span></div>}
        <div className="border-t border-gray-400 pt-1 mt-1">
          <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatCurrency(sale.grand_total, c)}</span></div>
        </div>
        <div className="flex justify-between"><span>Paid ({sale.payment_method})</span><span>{formatCurrency(sale.amount_paid, c)}</span></div>
        {sale.amount_due > 0 && <div className="flex justify-between font-bold"><span>Due</span><span>{formatCurrency(sale.amount_due, c)}</span></div>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      {/* Footer */}
      <div className="text-center text-xs">
        <p>{business.receipt_footer || 'Thank you for your business!'}</p>
      </div>
    </div>
  )
}
