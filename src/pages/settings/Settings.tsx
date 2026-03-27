import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, Input, Select, Button, Tabs } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { useProfileStore } from '@/store/profileStore'
import { useTheme } from '@/hooks/useTheme'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { profile, loadProfile } = useProfileStore()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)

  // Business fields
  const [bizName, setBizName] = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [bizEmail, setBizEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('Rs.')
  const [invoicePrefix, setInvoicePrefix] = useState('INV')
  const [receiptFooter, setReceiptFooter] = useState('')

  // App settings
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setBizName(profile.name); setBizAddress(profile.address || ''); setBizPhone(profile.phone || '')
      setBizEmail(profile.email || ''); setTaxId(profile.tax_id || ''); setCurrencySymbol(profile.currency_symbol)
      setInvoicePrefix(profile.invoice_prefix); setReceiptFooter(profile.receipt_footer || '')
    }
    window.api.invoke('settings:get-all').then((r: any) => { if (r.success) setSettings(r.data || {}) })
  }, [profile])

  const saveBusiness = async () => {
    setSaving(true)
    const r = await window.api.invoke('profile:update', {
      name: bizName, address: bizAddress || null, phone: bizPhone || null,
      email: bizEmail || null, tax_id: taxId || null, currency_symbol: currencySymbol,
      invoice_prefix: invoicePrefix, receipt_footer: receiptFooter || null
    })
    if (r.success) { toast.success('Business settings saved'); await loadProfile() }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  const updateSetting = async (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    await window.api.invoke('settings:update', { key, value })
  }

  const tabs = [
    { key: 'business', label: 'Business', count: 0 },
    { key: 'app', label: 'App Settings', count: 0 },
    { key: 'receipt', label: 'Receipt & Print', count: 0 }
  ]

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Settings" subtitle="Configure your business and app preferences" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'business' && (
        <Card>
          <CardHeader title="Business Information" action={<Button size="sm" loading={saving} icon={<Save className="w-4 h-4" />} onClick={saveBusiness}>Save</Button>} />
          <div className="space-y-4 max-w-xl">
            <Input label="Business Name" value={bizName} onChange={(e) => setBizName(e.target.value)} />
            <Input label="Address" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} />
              <Input label="Email" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tax ID / NTN" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              <Input label="Currency Symbol" value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
            </div>
            <Input label="Invoice Prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} hint="e.g. INV, BILL, REC" />
          </div>
        </Card>
      )}

      {activeTab === 'app' && (
        <div className="space-y-4 max-w-xl">
          <Card>
            <CardHeader title="Appearance" />
            <div className="space-y-3">
              <Select label="Theme" value={theme} onChange={(e) => { setTheme(e.target.value as 'light' | 'dark'); updateSetting('theme', e.target.value) }}
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Inventory" />
            <div className="space-y-3">
              <Input label="Low Stock Alert Threshold" type="number" value={settings.low_stock_alert || '5'}
                onChange={(e) => updateSetting('low_stock_alert', e.target.value)} hint="Default minimum stock level for new products" />
              <Input label="Expiry Alert Days" type="number" value={settings.expiry_alert_days || '30'}
                onChange={(e) => updateSetting('expiry_alert_days', e.target.value)} hint="Days before expiry to show alert" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Tax" />
            <Input label="Default Tax %" type="number" step="0.01" value={settings.default_tax || '0'}
              onChange={(e) => updateSetting('default_tax', e.target.value)} hint="Applied to new products by default" />
          </Card>
        </div>
      )}

      {activeTab === 'receipt' && (
        <div className="space-y-4 max-w-xl">
          <Card>
            <CardHeader title="Receipt Settings" action={<Button size="sm" loading={saving} icon={<Save className="w-4 h-4" />} onClick={saveBusiness}>Save</Button>} />
            <div className="space-y-3">
              <Select label="Receipt Format" value={settings.receipt_printer || 'a4'}
                onChange={(e) => updateSetting('receipt_printer', e.target.value)}
                options={[{ value: 'a4', label: 'A4 Invoice' }, { value: 'thermal', label: 'Thermal Receipt (80mm)' }]} />
              <Select label="Paper Size" value={settings.receipt_paper_size || '80mm'}
                onChange={(e) => updateSetting('receipt_paper_size', e.target.value)}
                options={[{ value: '80mm', label: '80mm' }, { value: '58mm', label: '58mm' }]} />
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium text-txt-primary">Show Tax on Receipt</p><p className="text-xs text-txt-muted">Display tax breakdown on printed receipts</p></div>
                <input type="checkbox" checked={settings.show_tax_on_receipt === '1'}
                  onChange={(e) => updateSetting('show_tax_on_receipt', e.target.checked ? '1' : '0')}
                  className="rounded border-surface-border text-primary focus:ring-primary h-4 w-4" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium text-txt-primary">Auto Print After Sale</p><p className="text-xs text-txt-muted">Automatically open print dialog after completing a sale</p></div>
                <input type="checkbox" checked={settings.auto_print_after_sale === '1'}
                  onChange={(e) => updateSetting('auto_print_after_sale', e.target.checked ? '1' : '0')}
                  className="rounded border-surface-border text-primary focus:ring-primary h-4 w-4" />
              </div>
              <Textarea label="Receipt Footer" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for your business!" rows={2} />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
