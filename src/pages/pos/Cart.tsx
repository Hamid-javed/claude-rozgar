import { Minus, Plus, Trash2, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  currency: string
  onCheckout: () => void
}

export function Cart({ currency, onCheckout }: Props) {
  const {
    items, customer_name, sale_type,
    updateQuantity, removeItem,
    setSaleType, getSubtotal, getDiscountAmount, getGrandTotal,
    discount_type, discount_value, setDiscount
  } = useCartStore()

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const grandTotal = getGrandTotal()
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-semibold text-txt-primary">
              Cart ({itemCount} items)
            </h2>
          </div>
          {/* Sale Type Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-surface-border text-xs">
            <button
              onClick={() => setSaleType('retail')}
              className={`px-3 py-1 transition-colors ${
                sale_type === 'retail' ? 'bg-primary text-white' : 'text-txt-secondary hover:bg-gray-50'
              }`}
            >
              Retail
            </button>
            <button
              onClick={() => setSaleType('wholesale')}
              className={`px-3 py-1 transition-colors ${
                sale_type === 'wholesale' ? 'bg-primary text-white' : 'text-txt-secondary hover:bg-gray-50'
              }`}
            >
              Wholesale
            </button>
          </div>
        </div>

        {/* Customer info */}
        {customer_name && (
          <div className="flex items-center gap-1.5 text-xs text-txt-secondary">
            <User className="w-3 h-3" />
            {customer_name}
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-txt-muted">
            <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Add products to begin</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {items.map((item) => (
              <div key={item.product_id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt-primary truncate">{item.product_name}</p>
                    <p className="text-xs text-txt-muted">
                      {formatCurrency(item.unit_price, currency)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-mono font-semibold text-txt-primary ml-3">
                    {formatCurrency(item.line_total, currency)}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-md border border-surface-border flex items-center justify-center text-txt-secondary hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-md border border-surface-border flex items-center justify-center text-txt-secondary hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="p-1.5 rounded-md text-txt-muted hover:text-danger hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals & Checkout */}
      <div className="border-t border-surface-border bg-gray-50/50 p-4 space-y-3">
        {/* Discount row */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-surface-border text-xs">
            <button
              onClick={() => setDiscount(discount_type === 'percent' ? null : 'percent', discount_value)}
              className={`px-2 py-1 transition-colors ${
                discount_type === 'percent' ? 'bg-warning text-white' : 'text-txt-secondary hover:bg-gray-50'
              }`}
            >
              %
            </button>
            <button
              onClick={() => setDiscount(discount_type === 'amount' ? null : 'amount', discount_value)}
              className={`px-2 py-1 transition-colors ${
                discount_type === 'amount' ? 'bg-warning text-white' : 'text-txt-secondary hover:bg-gray-50'
              }`}
            >
              {currency}
            </button>
          </div>
          <input
            type="number"
            value={discount_value || ''}
            onChange={(e) => setDiscount(discount_type || 'percent', Number(e.target.value) || 0)}
            placeholder="Discount"
            className="flex-1 h-8 rounded-lg border border-surface-border px-2 text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-txt-secondary">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-warning">
              <span>Discount</span>
              <span className="font-mono">-{formatCurrency(discountAmount, currency)}</span>
            </div>
          )}
        </div>

        {/* Grand total */}
        <div className="flex justify-between items-center pt-2 border-t border-surface-border">
          <span className="text-base font-heading font-semibold text-txt-primary">Total</span>
          <span className="text-2xl font-heading font-bold text-primary">
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>

        {/* Checkout button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Charge {formatCurrency(grandTotal, currency)} (F10)
        </Button>
      </div>
    </div>
  )
}
