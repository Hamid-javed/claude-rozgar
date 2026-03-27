import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Button, Input, Select, Card, CardHeader, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getTodayISO } from '@/utils/formatters'
import { CheckCircle, XCircle, Clock, Sun } from 'lucide-react'
import toast from 'react-hot-toast'

interface Staff { id: number; name: string; designation: string | null }
interface AttendanceRecord { staff_id: number; status: string }

const statusOptions = [
  { value: 'present', label: 'Present', icon: <CheckCircle className="w-4 h-4 text-success" />, color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'absent', label: 'Absent', icon: <XCircle className="w-4 h-4 text-danger" />, color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'half_day', label: 'Half Day', icon: <Clock className="w-4 h-4 text-warning" />, color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { value: 'leave', label: 'Leave', icon: <Sun className="w-4 h-4 text-info" />, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' }
]

export default function Attendance() {
  const { user } = useAuthStore()
  const [date, setDate] = useState(getTodayISO())
  const [staff, setStaff] = useState<Staff[]>([])
  const [attendance, setAttendance] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [staffRes, attRes] = await Promise.all([
      window.api.invoke('staff:list', { is_active: 1 }),
      window.api.invoke('attendance:list', { date })
    ])
    if (staffRes.success) setStaff(staffRes.data)
    if (attRes.success) {
      const map: Record<number, string> = {}
      for (const a of attRes.data) map[a.staff_id] = a.status
      setAttendance(map)
    }
    setLoading(false)
  }, [date])

  useEffect(() => { loadData() }, [loadData])

  const setStatus = (staffId: number, status: string) => {
    setAttendance((prev) => ({ ...prev, [staffId]: status }))
  }

  const markAllPresent = () => {
    const map: Record<number, string> = {}
    staff.forEach((s) => { map[s.id] = 'present' })
    setAttendance(map)
  }

  const handleSave = async () => {
    setSaving(true)
    const records = Object.entries(attendance).map(([staffId, status]) => ({
      staff_id: Number(staffId), attendance_date: date, status
    }))
    const r = await window.api.invoke('attendance:bulk-mark', { records, createdBy: user?.id })
    if (r.success) toast.success('Attendance saved')
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  const counts = {
    present: Object.values(attendance).filter((s) => s === 'present').length,
    absent: Object.values(attendance).filter((s) => s === 'absent').length,
    half_day: Object.values(attendance).filter((s) => s === 'half_day').length,
    leave: Object.values(attendance).filter((s) => s === 'leave').length
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Attendance" subtitle="Mark daily attendance"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={markAllPresent}>Mark All Present</Button>
            <Button size="sm" loading={saving} onClick={handleSave}>Save Attendance</Button>
          </div>
        } />

      {/* Date + Summary */}
      <div className="flex items-center gap-4">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
        <div className="flex gap-3 text-xs">
          <span className="text-success font-medium">Present: {counts.present}</span>
          <span className="text-danger font-medium">Absent: {counts.absent}</span>
          <span className="text-warning font-medium">Half: {counts.half_day}</span>
          <span className="text-info font-medium">Leave: {counts.leave}</span>
        </div>
      </div>

      {/* Staff grid */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : staff.length === 0 ? (
          <p className="text-center text-txt-muted py-10 text-sm">No active staff members. Add staff first.</p>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => {
              const current = attendance[s.id] || ''
              return (
                <div key={s.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-surface-border">
                  <div>
                    <p className="text-sm font-medium text-txt-primary">{s.name}</p>
                    {s.designation && <p className="text-xs text-txt-muted">{s.designation}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    {statusOptions.map((opt) => (
                      <button key={opt.value} onClick={() => setStatus(s.id, opt.value)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          current === opt.value ? opt.color + ' border-current' : 'border-surface-border text-txt-muted hover:bg-gray-50'
                        }`}>
                        {opt.icon}
                        <span className="hidden sm:inline">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
