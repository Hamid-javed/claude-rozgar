import { useState, useEffect } from 'react'
import { PageHeader, Button, Card, CardHeader, Badge } from '@/components/ui'
import { Download, Upload, FolderOpen, HardDrive, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface BackupFile {
  name: string; path: string; size: number; date: string
}

export default function BackupRestore() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [backupPath, setBackupPath] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    // Load backup path from settings
    window.api.invoke('settings:get', { key: 'backup_path' }).then((r: any) => {
      if (r.success && r.data) {
        setBackupPath(r.data)
        loadBackups(r.data)
      }
    })
  }, [])

  const loadBackups = async (path: string) => {
    if (!path) return
    const r = await window.api.invoke('backup:list', { path })
    if (r.success) setBackups(r.data)
  }

  const handleCreateBackup = async () => {
    setCreating(true)
    const r = await window.api.invoke('backup:create')
    if (r.success) {
      toast.success(`Backup saved to ${r.path}`)
      if (backupPath) loadBackups(backupPath)
    } else if (r.error !== 'Cancelled') {
      toast.error(r.error || 'Failed')
    }
    setCreating(false)
  }

  const handleRestore = async () => {
    if (!confirm('Are you sure? This will replace your current database with the backup. A safety backup will be created automatically.')) return
    setRestoring(true)
    const r = await window.api.invoke('backup:restore')
    if (r.success) {
      toast.success(`Restored from ${r.restoredFrom}. Please restart the app.`)
    } else if (r.error !== 'Cancelled') {
      toast.error(r.error || 'Failed')
    }
    setRestoring(false)
  }

  const handleSetBackupPath = async () => {
    const r = await window.api.invoke('dialog:open-dir')
    if (r.filePath) {
      setBackupPath(r.filePath)
      await window.api.invoke('settings:update', { key: 'backup_path', value: r.filePath })
      loadBackups(r.filePath)
      toast.success('Backup folder set')
    }
  }

  const handleAutoBackup = async () => {
    if (!backupPath) { toast.error('Set a backup folder first'); return }
    const r = await window.api.invoke('backup:auto', { path: backupPath })
    if (r.success) { toast.success('Auto backup created'); loadBackups(backupPath) }
    else toast.error(r.error || 'Failed')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Backup & Restore" subtitle="Keep your data safe" />

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-heading font-semibold text-txt-primary mb-1">Create Backup</h3>
          <p className="text-xs text-txt-muted mb-3">Save a copy of your database</p>
          <Button size="sm" loading={creating} onClick={handleCreateBackup} className="w-full">
            Create Backup
          </Button>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-heading font-semibold text-txt-primary mb-1">Restore Backup</h3>
          <p className="text-xs text-txt-muted mb-3">Restore from a previous backup</p>
          <Button size="sm" variant="secondary" loading={restoring} onClick={handleRestore} className="w-full">
            Restore from File
          </Button>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-heading font-semibold text-txt-primary mb-1">Backup Folder</h3>
          <p className="text-xs text-txt-muted mb-3 truncate max-w-[200px] mx-auto">{backupPath || 'Not set'}</p>
          <Button size="sm" variant="secondary" onClick={handleSetBackupPath} className="w-full">
            {backupPath ? 'Change Folder' : 'Set Folder'}
          </Button>
        </Card>
      </div>

      {/* Quick backup to configured folder */}
      {backupPath && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-txt-primary">Quick Backup</h3>
              <p className="text-xs text-txt-muted mt-0.5">Save a backup to your configured folder</p>
            </div>
            <Button size="sm" icon={<HardDrive className="w-4 h-4" />} onClick={handleAutoBackup}>
              Backup Now
            </Button>
          </div>
        </Card>
      )}

      {/* Backup history */}
      {backups.length > 0 && (
        <Card>
          <CardHeader title="Backup History" subtitle={`${backups.length} backups found`} />
          <div className="space-y-1">
            {backups.map((b) => (
              <div key={b.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-txt-primary">{b.name}</p>
                    <div className="flex items-center gap-2 text-xs text-txt-muted">
                      <Clock className="w-3 h-3" />
                      {formatDate(b.date, 'dd MMM yyyy, hh:mm a')}
                      <span>·</span>
                      {formatSize(b.size)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Important</p>
          <p className="text-xs text-amber-700 mt-0.5">Regular backups protect your business data. We recommend daily backups stored on an external drive or separate location.</p>
        </div>
      </div>
    </div>
  )
}
