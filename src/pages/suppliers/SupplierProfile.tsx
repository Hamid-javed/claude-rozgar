import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge, Button, Card, CardHeader, Input } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Phone, Mail, MapPin, Building2, Banknote } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface Supplier {
  id: number; name: string; company: string | null; phone: string | null; phone2: string | null
  email: string | null; address: string | null; area: string | null
  opening_balance: number; current_balance: number; is_active: number; created_at: string
}
interface LedgerEntry {
  id: number; transaction_type: string; amount: number; balance_after: number; description: string | null; created_at: string
}

interface Props { open: boolean; supplierId: number; currency: string; onClose: () => void }

const txnVariant: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
  payment: 'success', invoice: 'danger', opening: 'info', adjustment: 'default'
}

export function SupplierProfile({ open, supplierId, currency, onClose }: Props) {
  const { user } = useAuthStore()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payNotes, setPayNotes] = useState('')
  const [paying, setPaying] = useState(false)

  const load = async () => {
    setLoading(true)
    const [sRes, lRes] = await Promise.all([
      window.api.invoke('suppliers:get', { id: supplierId }),
      window.api.invoke('suppliers:ledger', { id: supplierId })
    ])
    if (sRes.success) setSupplier(sRes.data)
    if (lRes.success) setLedger(lRes.data)
    setLoading(false)
  }

  useEffect(() => { if (open) load() }, [open, supplierId])

  const handlePayment = async () => {
    const amount = Number(payAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setPaying(true)
    const r = await window.api.invoke('suppliers:make-payment', {
      supplier_id: supplierId, amount, method: payMethod, notes: payNotes || undefined, created_by: user?.id
    })
    if (r.success) {
      toast.success('Payment recorded')
      setPaymentOpen(false)
      setPayAmount(''); setPayNotes('')
      load()
    } else toast.error(r.error || 'Failed')
    setPaying(false)
  }

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Supplier Profile" size="lg"
        footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : !supplier ? (
          <p className="text-center text-txt-muted py-10">Not found</p>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-heading font-bold text-txt-primary">{supplier.name}</h3>
                {supplier.company && <p className="text-sm text-txt-secondary">{supplier.company}</p>}
              </div>
              <Badge variant={supplier.is_active ? 'success' : 'default'}>{supplier.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              {supplier.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={supplier.phone} />}
              {supplier.email && <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={supplier.email} />}
              {supplier.address && <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} value={supplier.address} />}
              {supplier.area && <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} value={supplier.area} />}
            </div>

            {/* Balance Card */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wide">Outstanding Balance</p>
                <p className={`text-2xl font-heading font-bold mt-1 ${supplier.current_balance > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(supplier.current_balance, currency)}
                </p>
              </div>
              {supplier.current_balance > 0 && (
                <Button size="sm" icon={<Banknote className="w-4 h-4" />} onClick={() => setPaymentOpen(true)}>
                  Make Payment
                </Button>
              )}
            </div>

            {/* Ledger */}
            <div>
              <h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Transaction History</h4>
              {ledger.length === 0 ? (
                <p className="text-sm text-txt-muted text-center py-6">No transactions yet</p>
              ) : (
                <div className="border border-surface-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-surface-border">
                        <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Date</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Description</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Amount</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => (
                        <tr key={entry.id} className="border-b border-surface-border last:border-0">
                          <td className="px-3 py-2 text-xs">{formatDateTime(entry.created_at)}</td>
                          <td className="px-3 py-2"><Badge variant={txnVariant[entry.transaction_type] || 'default'}>{entry.transaction_type}</Badge></td>
                          <td className="px-3 py-2 text-xs text-txt-secondary">{entry.description || '—'}</td>
                          <td className={`px-3 py-2 text-right font-mono text-sm font-medium ${entry.amount > 0 ? 'text-danger' : 'text-success'}`}>
                            {entry.amount > 0 ? '+' : ''}{formatCurrency(entry.amount, currency)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(entry.balance_after || 0, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Payment Modal */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Make Payment" size="sm"
        footer={<><Button variant="secondary" onClick={() => setPaymentOpen(false)}>Cancel</Button><Button loading={paying} onClick={handlePayment}>Record Payment</Button></>}>
        <div className="space-y-4">
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-txt-muted">Outstanding</p>
            <p className="text-xl font-heading font-bold text-danger">{formatCurrency(supplier?.current_balance || 0, currency)}</p>
          </div>
          <Input label="Amount" type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} autoFocus />
          <Select label="Method" options={[
            { value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'card', label: 'Card' }
          ]} value={payMethod} onChange={(e) => setPayMethod(e.target.value)} />
          <Input label="Notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional" />
        </div>
      </Modal>
    </>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-txt-secondary">
      <span className="text-txt-muted">{icon}</span>{value}
    </div>
  )
}
