import { create } from 'zustand'

export interface CartItem {
  product_id: number
  product_name: string
  product_sku: string | null
  unit_price: number
  buy_price: number
  quantity: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  line_total: number
  max_stock: number
}

interface CartState {
  items: CartItem[]
  customer_id: number | null
  customer_name: string | null
  sale_type: 'retail' | 'wholesale'
  discount_type: 'percent' | 'amount' | null
  discount_value: number
  notes: string

  addItem: (product: {
    id: number; name: string; sku: string | null
    sale_price: number; wholesale_price: number; buy_price: number
    tax_percent: number; current_stock: number; track_stock: number
  }) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateItemDiscount: (productId: number, percent: number) => void
  setCustomer: (id: number | null, name: string | null) => void
  setSaleType: (type: 'retail' | 'wholesale') => void
  setDiscount: (type: 'percent' | 'amount' | null, value: number) => void
  setNotes: (notes: string) => void
  clearCart: () => void

  // Computed
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTaxTotal: () => number
  getGrandTotal: () => number
}

function calculateItemTotals(item: CartItem): CartItem {
  const subtotal = item.unit_price * item.quantity
  const discountAmt = item.discount_percent > 0 ? subtotal * (item.discount_percent / 100) : 0
  const afterDiscount = subtotal - discountAmt
  const taxAmt = item.tax_percent > 0 ? afterDiscount * (item.tax_percent / 100) : 0
  return {
    ...item,
    discount_amount: Math.round(discountAmt * 100) / 100,
    tax_amount: Math.round(taxAmt * 100) / 100,
    line_total: Math.round((afterDiscount + taxAmt) * 100) / 100
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer_id: null,
  customer_name: null,
  sale_type: 'retail',
  discount_type: null,
  discount_value: 0,
  notes: '',

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        if (product.track_stock && newQty > product.current_stock) return state
        return {
          items: state.items.map((i) =>
            i.product_id === product.id
              ? calculateItemTotals({ ...i, quantity: newQty })
              : i
          )
        }
      }
      if (product.track_stock && product.current_stock <= 0) return state

      const price = state.sale_type === 'wholesale' && product.wholesale_price > 0
        ? product.wholesale_price
        : product.sale_price

      const newItem = calculateItemTotals({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: price,
        buy_price: product.buy_price,
        quantity: 1,
        discount_percent: 0,
        discount_amount: 0,
        tax_percent: product.tax_percent || 0,
        tax_amount: 0,
        line_total: 0,
        max_stock: product.track_stock ? product.current_stock : 999999
      })
      return { items: [...state.items, newItem] }
    })
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) }))
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId
          ? calculateItemTotals({ ...i, quantity: Math.min(quantity, i.max_stock) })
          : i
      )
    }))
  },

  updateItemDiscount: (productId, percent) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId
          ? calculateItemTotals({ ...i, discount_percent: Math.max(0, Math.min(100, percent)) })
          : i
      )
    }))
  },

  setCustomer: (id, name) => set({ customer_id: id, customer_name: name }),
  setSaleType: (type) => set({ sale_type: type }),
  setDiscount: (type, value) => set({ discount_type: type, discount_value: value }),
  setNotes: (notes) => set({ notes }),

  clearCart: () => set({
    items: [], customer_id: null, customer_name: null,
    sale_type: 'retail', discount_type: null, discount_value: 0, notes: ''
  }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.line_total, 0),

  getDiscountAmount: () => {
    const { discount_type, discount_value } = get()
    const subtotal = get().getSubtotal()
    if (!discount_type || discount_value <= 0) return 0
    if (discount_type === 'percent') return Math.round(subtotal * (discount_value / 100) * 100) / 100
    return Math.min(discount_value, subtotal)
  },

  getTaxTotal: () => get().items.reduce((sum, i) => sum + i.tax_amount, 0),

  getGrandTotal: () => {
    const subtotal = get().getSubtotal()
    const discount = get().getDiscountAmount()
    return Math.round((subtotal - discount) * 100) / 100
  }
}))
