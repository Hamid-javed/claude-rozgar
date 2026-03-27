import { Package, Plus, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

interface Product {
  id: number
  name: string
  sku: string | null
  sale_price: number
  wholesale_price: number
  buy_price: number
  tax_percent: number
  current_stock: number
  min_stock_alert: number
  track_stock: number
  category_name: string | null
  unit_abbreviation: string | null
}

interface Props {
  products: Product[]
  loading: boolean
  currency: string
  onAddItem: (product: Product) => void
}

export function ProductGrid({ products, loading, currency, onAddItem }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-surface-border p-4 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-gray-100 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-txt-muted">
        <Package className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map((product) => {
        const outOfStock = product.track_stock && product.current_stock <= 0
        const lowStock = product.track_stock && product.current_stock > 0 && product.current_stock <= product.min_stock_alert

        return (
          <button
            key={product.id}
            onClick={() => !outOfStock && onAddItem(product)}
            disabled={outOfStock}
            className={`
              relative text-left bg-white rounded-xl border border-surface-border p-3.5
              transition-all duration-150 group
              ${outOfStock
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.98]'
              }
            `}
          >
            {/* Quick-add button */}
            {!outOfStock && (
              <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-150">
                <Plus className="w-4 h-4" />
              </div>
            )}

            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-2.5">
              <Package className="w-5 h-5 text-primary" />
            </div>

            {/* Name */}
            <p className="text-sm font-medium text-txt-primary leading-snug line-clamp-2 mb-1">
              {product.name}
            </p>

            {/* Price */}
            <p className="text-base font-heading font-bold text-primary">
              {formatCurrency(product.sale_price, currency)}
            </p>

            {/* Stock indicator */}
            {product.track_stock ? (
              <div className="flex items-center gap-1 mt-1.5">
                {lowStock && <AlertTriangle className="w-3 h-3 text-warning" />}
                <span className={`text-xs ${
                  outOfStock ? 'text-danger font-medium' : lowStock ? 'text-warning' : 'text-txt-muted'
                }`}>
                  {outOfStock ? 'Out of stock' : `${product.current_stock} ${product.unit_abbreviation || 'pcs'}`}
                </span>
              </div>
            ) : (
              <span className="text-xs text-txt-muted mt-1.5 block">In stock</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
