import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Button, Card, CardHeader, Badge, ConfirmDialog, EmptyState, Input } from '@/components/ui'
import { Drawer } from '@/components/ui/Drawer'
import { Plus, Trash2, ChefHat, Clock, Users, Search, DollarSign } from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

interface Recipe {
  id: number; name: string; product_name: string | null; serves: number
  preparation_time: number | null; created_at: string
}

interface RecipeDetail extends Recipe {
  instructions: string | null
  ingredients: { id: number; ingredient_name: string; quantity: number; unit_name: string | null; buy_price: number }[]
}

export default function Recipes() {
  const { profile } = useProfileStore()
  const currency = profile?.currency_symbol || 'Rs.'
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<RecipeDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [serves, setServes] = useState('1')
  const [prepTime, setPrepTime] = useState('')
  const [instructions, setInstructions] = useState('')
  const [ingredients, setIngredients] = useState<{ ingredient_id: number; name: string; quantity: number; unit_id?: number }[]>([])
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [ingredientResults, setIngredientResults] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.api.invoke('recipes:list')
    if (r.success) setRecipes(r.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const viewDetail = async (id: number) => {
    const r = await window.api.invoke('recipes:get', { id })
    if (r.success) { setDetail(r.data); setDetailOpen(true) }
  }

  // Ingredient search
  useEffect(() => {
    if (!ingredientSearch) { setIngredientResults([]); return }
    const t = setTimeout(async () => {
      const r = await window.api.invoke('products:search', { query: ingredientSearch, limit: 6 })
      if (r.success) setIngredientResults(r.data)
    }, 300)
    return () => clearTimeout(t)
  }, [ingredientSearch])

  const addIngredient = (product: any) => {
    if (ingredients.find((i) => i.ingredient_id === product.id)) return
    setIngredients([...ingredients, { ingredient_id: product.id, name: product.name, quantity: 1, unit_id: product.unit_id }])
    setIngredientSearch(''); setIngredientResults([])
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Recipe name required'); return }
    setSaving(true)
    const r = await window.api.invoke('recipes:create', {
      name, serves: Number(serves) || 1, preparation_time: Number(prepTime) || null,
      instructions: instructions || null,
      ingredients: ingredients.map((i) => ({ ingredient_id: i.ingredient_id, quantity: i.quantity, unit_id: i.unit_id }))
    })
    if (r.success) { toast.success('Recipe created'); setFormOpen(false); setName(''); setIngredients([]); setInstructions(''); load() }
    else toast.error(r.error || 'Failed')
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const r = await window.api.invoke('recipes:delete', { id: deleteId })
    if (r.success) { toast.success('Recipe deleted'); load() } else toast.error(r.error || 'Failed')
    setDeleteId(null)
  }

  const recipeCost = detail?.ingredients.reduce((sum, i) => sum + i.quantity * (i.buy_price || 0), 0) || 0

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Recipes" subtitle={`${recipes.length} recipes`}
        actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>Add Recipe</Button>} />

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      : recipes.length === 0 ? <Card><EmptyState icon={<ChefHat className="w-8 h-8" />} title="No recipes yet" description="Add recipes to track ingredient costs"
          action={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setFormOpen(true)}>Add Recipe</Button>} /></Card>
      : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <button key={recipe.id} onClick={() => viewDetail(recipe.id)}
              className="text-left bg-white rounded-xl border border-surface-border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(recipe.id) }}
                  className="p-1 rounded text-txt-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="text-sm font-heading font-semibold text-txt-primary">{recipe.name}</h3>
              {recipe.product_name && <p className="text-xs text-txt-muted mt-0.5">Menu: {recipe.product_name}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-txt-muted">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {recipe.serves}</span>
                {recipe.preparation_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.preparation_time}min</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer open={detailOpen} onClose={() => { setDetailOpen(false); setDetail(null) }} title={detail?.name || 'Recipe'} size="lg"
        footer={<Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>}>
        {detail && (
          <div className="space-y-5">
            <div className="flex gap-3">
              {detail.serves > 0 && <Badge variant="default"><Users className="w-3 h-3 mr-1" />Serves {detail.serves}</Badge>}
              {detail.preparation_time && <Badge variant="default"><Clock className="w-3 h-3 mr-1" />{detail.preparation_time} min</Badge>}
            </div>

            <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
              <div><p className="text-xs text-txt-muted uppercase tracking-wide">Recipe Cost</p>
                <p className="text-xl font-heading font-bold text-orange-600 mt-1">{formatCurrency(recipeCost, currency)}</p></div>
              {detail.serves > 1 && <div className="text-right"><p className="text-xs text-txt-muted">Per serving</p>
                <p className="text-sm font-semibold text-txt-primary">{formatCurrency(recipeCost / detail.serves, currency)}</p></div>}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Ingredients</h4>
              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-surface-border">
                    <th className="text-left px-3 py-2 text-xs font-medium text-txt-muted uppercase">Ingredient</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-txt-muted uppercase">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-txt-muted uppercase">Cost</th>
                  </tr></thead>
                  <tbody>
                    {detail.ingredients.map((ing) => (
                      <tr key={ing.id} className="border-b border-surface-border last:border-0">
                        <td className="px-3 py-2">{ing.ingredient_name}</td>
                        <td className="px-3 py-2 text-center font-mono">{ing.quantity} {ing.unit_name || ''}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(ing.quantity * (ing.buy_price || 0), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detail.instructions && <div><h4 className="text-sm font-semibold text-txt-primary mb-2 uppercase tracking-wide">Instructions</h4>
              <p className="text-sm text-txt-secondary whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{detail.instructions}</p></div>}
          </div>
        )}
      </Drawer>

      {/* Add Recipe Drawer */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title="Add Recipe" size="lg"
        footer={<><Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Create Recipe</Button></>}>
        <div className="space-y-4">
          <Input label="Recipe Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken Karahi" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Serves" type="number" value={serves} onChange={(e) => setServes(e.target.value)} />
            <Input label="Prep Time (min)" type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium text-txt-primary mb-2">Ingredients</p>
            <div className="relative mb-2">
              <Input placeholder="Search ingredients..." value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
              {ingredientResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {ingredientResults.map((p: any) => (
                    <button key={p.id} type="button" onClick={() => addIngredient(p)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-surface-border last:border-0">{p.name}</button>
                  ))}
                </div>
              )}
            </div>
            {ingredients.length > 0 && (
              <div className="space-y-1">
                {ingredients.map((ing, i) => (
                  <div key={ing.ingredient_id} className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg">
                    <span className="text-sm flex-1">{ing.name}</span>
                    <input type="number" min="0.01" step="0.01" value={ing.quantity}
                      onChange={(e) => setIngredients(ingredients.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) || 0 } : x))}
                      className="w-20 text-center text-sm border border-surface-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <button onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))} className="p-1 text-txt-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-txt-primary block mb-1">Instructions</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Cooking steps..."
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Recipe" message="This recipe and its ingredients will be removed." confirmText="Delete" variant="danger" />
    </div>
  )
}
