import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, ScanBarcode, Grid3X3 } from 'lucide-react'
import { Input } from '@/components/ui'
import { useCartStore } from '@/store/cartStore'
import { useProfileStore } from '@/store/profileStore'
import { ProductGrid } from './ProductGrid'
import { Cart } from './Cart'
import { PaymentPanel } from './PaymentPanel'

interface Category {
  id: number
  name: string
}

export default function POS() {
  const { profile } = useProfileStore()
  const { addItem } = useCartStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  // Load categories
  useEffect(() => {
    const load = async () => {
      const result = await window.api.invoke('categories:list')
      if (result.success) setCategories(result.data)
    }
    load()
  }, [])

  // Load products based on search/category
  const loadProducts = useCallback(async () => {
    setLoading(true)
    const params: Record<string, unknown> = {
      page: 1, pageSize: 100, is_active: 1
    }
    if (searchQuery) params.search = searchQuery
    if (selectedCategory) params.category_id = selectedCategory

    const result = await window.api.invoke('products:list', params)
    if (result.success) setProducts(result.data)
    setLoading(false)
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F10') {
        e.preventDefault()
        setPaymentOpen(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Barcode scan detection (keyboard wedge)
  useEffect(() => {
    let buffer = ''
    let timeout: ReturnType<typeof setTimeout>

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement) !== searchRef.current) return

      if (e.key === 'Enter' && buffer.length > 5) {
        // Likely a barcode scan
        const barcode = buffer.trim()
        buffer = ''
        handleBarcodeScan(barcode)
        return
      }
      if (e.key.length === 1) {
        buffer += e.key
        clearTimeout(timeout)
        timeout = setTimeout(() => { buffer = '' }, 100)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      clearTimeout(timeout)
    }
  }, [])

  const handleBarcodeScan = async (barcode: string) => {
    const result = await window.api.invoke('products:by-barcode', { barcode })
    if (result.success && result.data) {
      addItem({
        id: result.data.id,
        name: result.data.name,
        sku: result.data.sku,
        sale_price: result.data.sale_price,
        wholesale_price: result.data.wholesale_price,
        buy_price: result.data.buy_price,
        tax_percent: result.data.tax_percent,
        current_stock: result.data.current_stock,
        track_stock: result.data.track_stock
      })
    }
  }

  const productLabel = profile?.custom_labels?.['Products'] || 'Products'

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left Panel — Product Search & Grid */}
      <div className="flex-[3] flex flex-col border-r border-surface-border bg-surface-app">
        {/* Search */}
        <div className="p-4 bg-white border-b border-surface-border">
          <Input
            ref={searchRef}
            placeholder={`Search ${productLabel.toLowerCase()} by name, SKU, barcode... (F2)`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={
              <button className="text-txt-muted hover:text-primary transition-colors" title="Scan barcode">
                <ScanBarcode className="w-4 h-4" />
              </button>
            }
          />
        </div>

        {/* Category pills */}
        <div className="px-4 py-2.5 bg-white border-b border-surface-border">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-txt-secondary hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-txt-secondary hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid
            products={products}
            loading={loading}
            currency={profile?.currency_symbol || 'Rs.'}
            onAddItem={(product) => addItem({
              id: product.id,
              name: product.name,
              sku: product.sku,
              sale_price: product.sale_price,
              wholesale_price: product.wholesale_price || 0,
              buy_price: product.buy_price,
              tax_percent: product.tax_percent || 0,
              current_stock: product.current_stock,
              track_stock: product.track_stock
            })}
          />
        </div>
      </div>

      {/* Right Panel — Cart & Checkout */}
      <div className="flex-[2] flex flex-col bg-white min-w-[380px] max-w-[480px]">
        <Cart
          currency={profile?.currency_symbol || 'Rs.'}
          onCheckout={() => setPaymentOpen(true)}
        />
      </div>

      {/* Payment Modal */}
      <PaymentPanel
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        currency={profile?.currency_symbol || 'Rs.'}
        onSaleComplete={() => {
          setPaymentOpen(false)
          loadProducts() // Refresh stock
        }}
      />
    </div>
  )
}
