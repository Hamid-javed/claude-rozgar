import { formatCurrency, formatDate } from '@/utils/formatters'

interface SaleItem {
  product_name: string; product_sku?: string | null; quantity: number
  unit_price: number; discount_amount: number; tax_amount: number; line_total: number
}

interface InvoiceData {
  invoice_number: string; sale_date: string; customer_name: string | null
  sale_type: string; subtotal: number; discount_amount: number; tax_amount: number
  grand_total: number; amount_paid: number; amount_due: number
  payment_method: string; notes: string | null; items: SaleItem[]
}

interface BusinessInfo {
  name: string; address?: string | null; phone?: string | null
  email?: string | null; tax_id?: string | null; currency_symbol: string
  receipt_footer?: string | null
}

interface Props {
  sale: InvoiceData
  business: BusinessInfo
}

export function InvoiceA4({ sale, business }: Props) {
  const c = business.currency_symbol

  return (
    <div className="invoice-a4 bg-white p-8 max-w-[210mm] mx-auto text-sm text-gray-800 font-body print:p-0 print:shadow-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'DM Sans, sans-serif' }}>{business.name}</h1>
          {business.address && <p className="text-xs text-gray-500 mt-1">{business.address}</p>}
          <div className="flex gap-4 text-xs text-gray-500 mt-1">
            {business.phone && <span>Tel: {business.phone}</span>}
            {business.email && <span>{business.email}</span>}
          </div>
          {business.tax_id && <p className="text-xs text-gray-500 mt-0.5">Tax ID: {business.tax_id}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-blue-600 uppercase tracking-wider">Invoice</h2>
          <p className="text-sm font-mono font-bold mt-1">{sale.invoice_number}</p>
          <p className="text-xs text-gray-500 mt-1">Date: {formatDate(sale.sale_date)}</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
        <p className="font-semibold">{sale.customer_name || 'Walk-in Customer'}</p>
        {sale.sale_type !== 'retail' && <p className="text-xs text-gray-500 capitalize">{sale.sale_type} sale</p>}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">#</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Description</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Qty</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-500">{i + 1}</td>
              <td className="py-2 px-3">
                <p className="font-medium">{item.product_name}</p>
                {item.product_sku && <p className="text-xs text-gray-400 font-mono">{item.product_sku}</p>}
              </td>
              <td className="py-2 px-3 text-center font-mono">{item.quantity}</td>
              <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.unit_price, c)}</td>
              <td className="py-2 px-3 text-right font-mono font-medium">{formatCurrency(item.line_total, c)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-1">
          <Row label="Subtotal" value={formatCurrency(sale.subtotal, c)} />
          {sale.discount_amount > 0 && <Row label="Discount" value={`-${formatCurrency(sale.discount_amount, c)}`} />}
          {sale.tax_amount > 0 && <Row label="Tax" value={formatCurrency(sale.tax_amount, c)} />}
          <div className="border-t-2 border-gray-800 pt-1 mt-1">
            <Row label="Grand Total" value={formatCurrency(sale.grand_total, c)} bold />
          </div>
          <Row label="Amount Paid" value={formatCurrency(sale.amount_paid, c)} />
          {sale.amount_due > 0 && <Row label="Balance Due" value={formatCurrency(sale.amount_due, c)} bold className="text-red-600" />}
        </div>
      </div>

      {/* Payment */}
      <div className="text-xs text-gray-500 mb-4">
        Payment Method: <span className="capitalize">{sale.payment_method.replace('_', ' ')}</span>
      </div>

      {/* Notes */}
      {sale.notes && <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded">Note: {sale.notes}</div>}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-400">
        {business.receipt_footer || 'Thank you for your business!'}
      </div>
    </div>
  )
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold text-base' : ''} ${className || ''}`}>
      <span>{label}</span><span className="font-mono">{value}</span>
    </div>
  )
}
