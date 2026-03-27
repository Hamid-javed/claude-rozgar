import { useState } from 'react'
import { Input, Button, Badge, ConfirmDialog } from '@/components/ui'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: number
  name: string
  product_count: number
  color: string | null
}

interface Props {
  categories: Category[]
  onUpdate: () => void
}

export function CategoryManager({ categories, onUpdate }: Props) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const result = await window.api.invoke('categories:create', { name: newName.trim() })
    if (result.success) {
      toast.success('Category added')
      setNewName('')
      onUpdate()
    } else {
      toast.error(result.error || 'Failed to add')
    }
    setAdding(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const result = await window.api.invoke('categories:delete', { id: deleteId })
    if (result.success) {
      toast.success('Category deleted')
      onUpdate()
    } else {
      toast.error(result.error || 'Cannot delete category')
    }
    setDeleteId(null)
    setDeleting(false)
  }

  return (
    <div className="space-y-5">
      {/* Add new */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="New Category"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          />
        </div>
        <Button size="sm" loading={adding} onClick={handleAdd} icon={<Plus className="w-4 h-4" />}>
          Add
        </Button>
      </div>

      {/* List */}
      <div className="space-y-1">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-txt-muted text-sm">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No categories yet
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color || '#94a3b8' }}
                />
                <span className="text-sm font-medium text-txt-primary">{cat.name}</span>
                <Badge variant="default">{cat.product_count}</Badge>
              </div>
              <button
                onClick={() => setDeleteId(cat.id)}
                className="p-1 rounded text-txt-muted hover:text-danger hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure? Categories with products cannot be deleted."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
