export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercent = 0,
  taxPercent = 0
): { discountAmount: number; taxAmount: number; lineTotal: number } {
  const subtotal = quantity * unitPrice
  const discountAmount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (taxPercent / 100)
  const lineTotal = afterDiscount + taxAmount

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    lineTotal: Math.round(lineTotal * 100) / 100
  }
}

export function calculateProfit(salePrice: number, buyPrice: number, quantity: number): number {
  return Math.round((salePrice - buyPrice) * quantity * 100) / 100
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: 'percent' | 'amount' | 'none',
  discountValue: number
): number {
  if (discountType === 'percent') {
    return Math.round(subtotal * (discountValue / 100) * 100) / 100
  }
  if (discountType === 'amount') {
    return Math.min(discountValue, subtotal)
  }
  return 0
}
