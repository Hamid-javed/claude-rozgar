import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Button, Select, Card, Badge } from '@/components/ui'
import { useProfileStore } from '@/store/profileStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatters'
import { Calculator, CheckCircle, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

interface PayrollEntry {
  id: number; staff_id: number; staff_name: string; month: string
  base_salary: number; days_present: number; days_absent: number
  overtime_amount: number; bonuses: number; deductions: number
  advance_deduction: number; net_salary: number; payment_date: string | null
  payment_method: string; status: string
}

export default function Payroll() {
  const { profile } = useProfileStore()
  const { user } = useAuthStore()
  const currency = profile?.currency_symbol || 'Rs.'

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(currentMonth)
  const [payroll, setPayroll] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadPayroll = useCallback(async () => {
    setLoading(true)
    const r = await window.api.invoke('payroll:list', { month })
    if (r.success) setPayroll(r.data)
    setLoading(false)
  }, [month])

  useEffect(() => { loadPayroll() }, [loadPayroll])

  const handleGenerate = async () => {
    setGenerating(true)
    const r = await window.api.invoke('payroll:generate', { month, createdBy: user?.id })
    if (r.success) { toast.success('Payroll generated'); loadPayroll() }
    else toast.error(r.error || 'Failed')
    setGenerating(false)
  }

  const handlePay = async (id: number) => {
    const r = await window.api.invoke('payroll:pay', { id, paymentMethod: 'cash' })
    if (r.success) { toast.success('Marked as paid'); loadPayroll() }
    else toast.error(r.error || 'Failed')
  }

  const totalNet = payroll.reduce((sum, p) => sum + p.net_salary, 0)
  const totalPaid = payroll.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.net_salary, 0)
  const totalPending = totalNet - totalPaid

  // Build month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    return { value: val, label }
  })

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Payroll" subtitle="Generate and manage monthly payroll"
        actions={
          payroll.length === 0 ? (
            <Button size="sm" icon={<Calculator className="w-4 h-4" />} loading={generating} onClick={handleGenerate}>Generate Payroll</Button>
          ) : undefined
        } />

      {/* Month selector + Summary */}
      <div className="flex items-center gap-4">
        <Select options={monthOptions} value={month} onChange={(e) => setMonth(e.target.value)} className="w-52" />
        {payroll.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span>Total: <strong className="font-mono">{formatCurrency(totalNet, currency)}</strong></span>
            <span className="text-success">Paid: <strong className="font-mono">{formatCurrency(totalPaid, currency)}</strong></span>
            {totalPending > 0 && <span className="text-danger">Pending: <strong className="font-mono">{formatCurrency(totalPending, currency)}</strong></span>}
          </div>
        )}
      </div>

      {/* Payroll table */}
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : payroll.length === 0 ? (
          <div className="py-16 text-center">
            <Calculator className="w-10 h-10 mx-auto text-txt-muted opacity-40 mb-3" />
            <p className="text-sm text-txt-muted mb-3">No payroll generated for this month</p>
            <Button size="sm" icon={<Calculator className="w-4 h-4" />} loading={generating} onClick={handleGenerate}>Generate Payroll</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-surface-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-txt-muted uppercase">Staff</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Base</th>
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Days</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">OT</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Deduct</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Net Salary</th>
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-txt-muted uppercase">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-txt-muted uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((p, i) => (
                  <tr key={p.id} className={`border-b border-surface-border last:border-0 ${i % 2 === 1 ? 'bg-surface-app' : ''}`}>
                    <td className="px-4 py-3 font-medium text-txt-primary">{p.staff_name}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatCurrency(p.base_salary, currency)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-success">{p.days_present}</span>
                      {p.days_absent > 0 && <span className="text-danger ml-1">/ {p.days_absent}A</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{p.overtime_amount > 0 ? formatCurrency(p.overtime_amount, currency) : '—'}</td>
                    <td className="px-3 py-3 text-right font-mono text-danger">{p.advance_deduction > 0 ? `-${formatCurrency(p.advance_deduction, currency)}` : '—'}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">{formatCurrency(p.net_salary, currency)}</td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'pending' && (
                        <Button variant="ghost" size="sm" icon={<CreditCard className="w-3.5 h-3.5" />} onClick={() => handlePay(p.id)}>Pay</Button>
                      )}
                      {p.status === 'paid' && <CheckCircle className="w-4 h-4 text-success inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
