import { useState, useEffect, useRef } from 'react'
import { PageHeader, Button, Input, Card, CardHeader } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import { Search, Printer, Plus, X } from 'lucide-react'
import { printContent } from '@/utils/printHelpers'
import JsBarcode from 'jsbarcode'

interface Product {
  id: number; name: string; sku: string | null; barcode: string | null; sale_price: number
}

interface LabelItem {
  product: Product
  copies: number
}

export default function BarcodeLabels() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [items, setItems] = useState<LabelItem[]>([])

  // Product search
  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const r = await window.api.invoke('products:search', { query: searchQuery, limit: 8 })
      if (r.success) setSearchResults(r.data)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const addProduct = (product: Product) => {
    if (items.find((i) => i.product.id === product.id)) {
      setItems(items.map((i) => i.product.id === product.id ? { ...i, copies: i.copies + 1 } : i))
    } else {
      setItems([...items, { product, copies: 1 }])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const updateCopies = (productId: number, copies: number) => {
    if (copies <= 0) { setItems(items.filter((i) => i.product.id !== productId)); return }
    setItems(items.map((i) => i.product.id === productId ? { ...i, copies } : i))
  }

  const handlePrint = () => {
    // Generate barcode SVGs
    const labels: string[] = []
    for (const item of items) {
      const code = item.product.barcode || item.product.sku || `P${item.product.id}`
      for (let i = 0; i < item.copies; i++) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        try {
          JsBarcode(svg, code, { format: 'CODE128', width: 1.5, height: 40, fontSize: 10, margin: 2 })
        } catch {
          JsBarcode(svg, String(item.product.id), { format: 'CODE128', width: 1.5, height: 40, fontSize: 10, margin: 2 })
        }

        labels.push(`
          <div style="display:inline-block;width:48mm;height:28mm;border:0.5px dashed #ccc;padding:2mm;text-align:center;font-family:sans-serif;overflow:hidden;page-break-inside:avoid;">
            <div style="font-size:9px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1mm;">${item.product.name}</div>
            ${svg.outerHTML}
            <div style="font-size:10px;font-weight:700;margin-top:1mm;">${formatCurrency(item.product.sale_price, currency)}</div>
          </div>
        `)
      }
    }

    const html = `
      <div style="display:flex;flex-wrap:wrap;gap:2mm;padding:5mm;">
        ${labels.join('')}
      </div>
    `
    printContent(html, 'Barcode Labels')
  }

  const totalLabels = items.reduce((sum, i) => sum + i.copies, 0)

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Barcode Labels" subtitle="Generate and print barcode labels"
        actions={items.length > 0 ? <Button size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>Print {totalLabels} Labels</Button> : undefined} />

      {/* Search */}
      <Card>
        <div className="relative">
          <Input placeholder="Search products to add..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          {searchResults.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((p) => (
                <button key={p.id} type="button" onClick={() => addProduct(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-surface-border last:border-0">
                  <p className="text-sm font-medium text-txt-primary">{p.name}</p>
                  <p className="text-xs text-txt-muted">{p.sku || p.barcode || `ID: ${p.id}`} · {formatCurrency(p.sale_price, currency)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Selected products */}
      {items.length === 0 ? (
        <Card><p className="text-center text-sm text-txt-muted py-8">Search and add products to generate barcode labels</p></Card>
      ) : (
        <Card>
          <CardHeader title={`${items.length} Products · ${totalLabels} Labels`} />
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt-primary truncate">{item.product.name}</p>
                  <p className="text-xs text-txt-muted font-mono">{item.product.barcode || item.product.sku || `P${item.product.id}`}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-xs text-txt-muted">Copies:</span>
                  <input type="number" min="1" value={item.copies} onChange={(e) => updateCopies(item.product.id, Number(e.target.value))}
                    className="w-16 text-center text-sm border border-surface-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={() => updateCopies(item.product.id, 0)} className="p-1 text-txt-muted hover:text-danger"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview */}
      {items.length > 0 && (
        <Card>
          <CardHeader title="Preview" />
          <div className="flex flex-wrap gap-2">
            {items.slice(0, 6).map((item) => (
              <BarcodePreview key={item.product.id} product={item.product} currency={currency} />
            ))}
            {totalLabels > 6 && <div className="flex items-center px-4 text-sm text-txt-muted">+{totalLabels - 6} more labels...</div>}
          </div>
        </Card>
      )}
    </div>
  )
}

function BarcodePreview({ product, currency }: { product: Product; currency: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const code = product.barcode || product.sku || `P${product.id}`
    try { JsBarcode(svgRef.current, code, { format: 'CODE128', width: 1.5, height: 35, fontSize: 9, margin: 2 }) }
    catch { JsBarcode(svgRef.current, String(product.id), { format: 'CODE128', width: 1.5, height: 35, fontSize: 9, margin: 2 }) }
  }, [product])

  return (
    <div className="border border-dashed border-surface-border rounded-lg p-2 text-center" style={{ width: '180px' }}>
      <p className="text-xs font-semibold text-txt-primary truncate mb-1">{product.name}</p>
      <svg ref={svgRef} className="mx-auto" />
      <p className="text-xs font-bold text-txt-primary mt-1">{formatCurrency(product.sale_price, currency)}</p>
    </div>
  )
}
