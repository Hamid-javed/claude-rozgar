import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge, Button, Input, Modal, Select } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { Phone, Mail, MapPin, Banknote, Star } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface Customer {
  id: number; name: string; phone: string | null; email: string | null
  address: string | null; area: string | null; customer_type: string
  opening_balance: number; current_balance: number; credit_limit: number
  loyalty_points: number; is_active: number; created_at: string
}
interface LedgerEntry {
  id: number; transaction_type: string; amount: number; balance_after: number
  description: string | null; created_at: string
}

const txnVariant: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
  payment: 'success', invoice: 'danger', opening: 'info', adjustment: 'default', return: 'warning'
}

interface Props { open: boolean; customerId: number; currency: string; onClose: () => void }

export function CustomerProfile({ open, customerId, currency, onClose }: Props) {
  const { user } = useAuthStore()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payNotes, setPayNotes] = useState('')
  const [paying, setPaying] = useState(false)

  const load = async () => {
    setLoading(true)
    const [cRes, lRes] = await Promise.all([
      window.api.invoke('customers:get', { id: customerId }),
      window.api.invoke('customers:ledger', { id: customerId })
    ])
    if (cRes.success) setCustomer(cRes.data)
    if (lRes.success) setLedger(lRes.data)
    setLoading(false)
  }

  useEffect(() => { if (open) load() }, [open, customerId])

  const handlePayment = async () => {
    const amount = Number(payAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setPaying(true)
    const r = await window.api.invoke('customers:receive-payment', {
      customer_id: customerId, amount, method: payMethod, notes: payNotes || undefined, created_by: user?.id
    })
    if (r.success) { toast.success('Payment received'); setPaymentOpen(false); setPayAmount(''); setPayNotes(''); load() }
    else toast.error(r.error || 'Failed')
    setPaying(false)
  }

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Customer Profile" size="lg"
        footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : !customer ? (
          <p className="text-center text-txt-muted py-10">Not found</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-heading font-bold text-txt-primary">{customer.name}</h3>
                <Badge variant={customer.customer_type === 'wholesale' ? 'info' : 'default'}>{customer.customer_type}</Badge>
              </div>
              <Badge variant={customer.is_active ? 'success' : 'default'}>{customer.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {customer.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={customer.phone} />}
              {customer.email && <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={customer.email} />}
              {customer.address && <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} value={customer.address} />}
              {customer.loyalty_points > 0 && <InfoRow icon={<Star className="w-3.5 h-3.5" />} value={`${customer.loyalty_points} loyalty points`} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-txt-muted uppercase tracking-wide">Balance Due</p>
                <p className={`text-2xl font-heading font-bold mt-1 ${customer.current_balance > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(customer.current_balance, currency)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-txt-muted uppercase tracking-wide">Credit Limit</p>
                  <p className="text-xl font-heading font-bold mt-1 text-txt-primary">
                    {customer.credit_limit > 0 ? formatCurrency(customer.credit_limit, currency) : 'Unlimited'}
                  </p>
                </div>
                {customer.current_balance > 0 && (
                  <Button size="sm" icon={<Banknote className="w-4 h-4" />} onClick={() => setPaymentOpen(true)}>Receive</Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Transaction History</h4>
              {ledger.length === 0 ? (
                <p className="text-sm text-txt-muted text-center py-6">No transactions yet</p>
              ) : (
                <div className="border border-surface-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-surface-border">
                      <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Date</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Type</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Description</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Amount</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Balance</th>
                    </tr></thead>
                    <tbody>
                      {ledger.map((e) => (
                        <tr key={e.id} className="border-b border-surface-border last:border-0">
                          <td className="px-3 py-2 text-xs">{formatDateTime(e.created_at)}</td>
                          <td className="px-3 py-2"><Badge variant={txnVariant[e.transaction_type] || 'default'}>{e.transaction_type}</Badge></td>
                          <td className="px-3 py-2 text-xs text-txt-secondary">{e.description || '—'}</td>
                          <td className={`px-3 py-2 text-right font-mono text-sm font-medium ${e.amount > 0 ? 'text-danger' : 'text-success'}`}>
                            {e.amount > 0 ? '+' : ''}{formatCurrency(e.amount, currency)}</td>
                          <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(e.balance_after || 0, currency)}</td>
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

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Receive Payment" size="sm"
        footer={<><Button variant="secondary" onClick={() => setPaymentOpen(false)}>Cancel</Button><Button loading={paying} onClick={handlePayment}>Receive Payment</Button></>}>
        <div className="space-y-4">
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-txt-muted">Outstanding</p>
            <p className="text-xl font-heading font-bold text-danger">{formatCurrency(customer?.current_balance || 0, currency)}</p>
          </div>
          <Input label="Amount" type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} autoFocus />
          <Select label="Method" options={[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'card', label: 'Card' }]}
            value={payMethod} onChange={(e) => setPayMethod(e.target.value)} />
          <Input label="Notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Optional" />
        </div>
      </Modal>
    </>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-center gap-2 text-sm text-txt-secondary"><span className="text-txt-muted">{icon}</span>{value}</div>
}
