import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { pagesAPI } from '../lib/api'
import { FiPlus, FiTrash2, FiCheck, FiX, FiEdit2, FiToggleLeft, FiToggleRight, FiChevronDown, FiChevronUp } from 'react-icons/fi'

const CATEGORIES = [
  { key: 'location', label: 'Location / Emirates' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'yearsOfExperience', label: 'Years of Experience' },
  { key: 'availability', label: 'Work Availability' },
  { key: 'gender', label: 'Gender' },
]

export default function ListOptionsPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [activeCategory, setActiveCategory] = useState('location')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newOption, setNewOption] = useState({ key: '', label: { en: '', ar: '' }, order: 0 })
  const [editForm, setEditForm] = useState({ key: '', label: { en: '', ar: '' }, order: 0, isActive: true })

  const fetchOptions = async () => {
    setLoading(true)
    try {
      const res = await pagesAPI.getListOptions(activeCategory)
      setOptions(res.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch options:', err)
      setOptions([])
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchOptions()
  }, [activeCategory])

  const handleAdd = async () => {
    if (!newOption.key.trim() || !newOption.label.en.trim() || !newOption.label.ar.trim()) return
    setSaving(true)
    try {
      await pagesAPI.createListOption({ category: activeCategory, ...newOption })
      setNewOption({ key: '', label: { en: '', ar: '' }, order: 0 })
      setShowAdd(false)
      fetchOptions()
    } catch (err) {
      showToast({ type: 'error', text: err.message || 'Failed to add option' })
    }
    setSaving(false)
  }

  const handleUpdate = async (id) => {
    setSaving(true)
    try {
      await pagesAPI.updateListOption(id, editForm)
      setEditingId(null)
      fetchOptions()
    } catch (err) {
      showToast({ type: 'error', text: err.message || 'Failed to update option' })
    }
    setSaving(false)
  }

  const handleToggleActive = async (opt) => {
    try {
      await pagesAPI.updateListOption(opt._id, { ...opt, isActive: !opt.isActive })
      fetchOptions()
    } catch (err) {
      showToast({ type: 'error', text: err.message || 'Failed to toggle' })
    }
  }

  const handleDelete = async (opt) => {
    const catLabel = CATEGORIES.find(c => c.key === opt.category)?.label || opt.category
    const confirmMsg = `Permanently delete "${opt.label.en}" from ${catLabel}?\n\nNote: If any users have this value selected, their data will show the raw key instead of the label.\n\nConsider deactivating instead.`
    if (!(await confirm(confirmMsg))) return
    try {
      await pagesAPI.deleteListOption(opt._id)
      fetchOptions()
    } catch (err) {
      showToast({ type: 'error', text: err.message || 'Failed to delete' })
    }
  }

  const startEdit = (opt) => {
    setEditingId(opt._id)
    setEditForm({ key: opt.key, label: { ...opt.label }, order: opt.order, isActive: opt.isActive })
  }

  const catLabel = CATEGORIES.find(c => c.key === activeCategory)?.label || activeCategory

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">List Options</h1>
        <p className="text-sm text-gray-500 mt-1">Manage dropdown options for user profiles and filters. Deactivate options instead of deleting to preserve existing user data.</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveCategory(cat.key); setEditingId(null); setShowAdd(false) }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeCategory === cat.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add {catLabel} Option
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">New {catLabel} Option</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Key (stored value)</label>
              <input
                type="text"
                value={newOption.key}
                onChange={(e) => setNewOption(p => ({ ...p, key: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g. dubai, indian, chef"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">English Label</label>
              <input
                type="text"
                value={newOption.label.en}
                onChange={(e) => setNewOption(p => ({ ...p, label: { ...p.label, en: e.target.value } }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Dubai"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Arabic Label</label>
              <input
                type="text"
                value={newOption.label.ar}
                onChange={(e) => setNewOption(p => ({ ...p, label: { ...p.label, ar: e.target.value } }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="دبي"
                dir="rtl"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
              <input
                type="number"
                value={newOption.order}
                onChange={(e) => setNewOption(p => ({ ...p, order: Number(e.target.value) }))}
                className="w-20 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark disabled:opacity-50">
                {saving ? 'Saving...' : 'Add'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : options.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No options in this category</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Key</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">English</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Arabic</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {options.map(opt => (
                editingId === opt._id ? (
                  <tr key={opt._id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input type="number" value={editForm.order} onChange={(e) => setEditForm(p => ({ ...p, order: Number(e.target.value) }))} className="w-16 px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editForm.key} onChange={(e) => setEditForm(p => ({ ...p, key: e.target.value }))} className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editForm.label.en} onChange={(e) => setEditForm(p => ({ ...p, label: { ...p.label, en: e.target.value } }))} className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editForm.label.ar} onChange={(e) => setEditForm(p => ({ ...p, label: { ...p.label, ar: e.target.value } }))} className="w-full px-2 py-1 border rounded text-sm" dir="rtl" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => setEditForm(p => ({ ...p, isActive: !p.isActive }))}>
                        {editForm.isActive ? <FiToggleRight className="w-6 h-6 text-green-500 mx-auto" /> : <FiToggleLeft className="w-6 h-6 text-gray-400 mx-auto" />}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleUpdate(opt._id)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={opt._id} className={`hover:bg-gray-50 ${!opt.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-500">{opt.order}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{opt.key}</td>
                    <td className="px-4 py-3">{opt.label.en}</td>
                    <td className="px-4 py-3" dir="rtl">{opt.label.ar}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(opt)} title={opt.isActive ? 'Deactivate' : 'Activate'}>
                        {opt.isActive ? <FiToggleRight className="w-6 h-6 text-green-500 mx-auto" /> : <FiToggleLeft className="w-6 h-6 text-gray-400 mx-auto" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => startEdit(opt)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(opt)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete permanently">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-amber-800 mb-1">Best Practice: Deactivate, Don't Delete</h4>
        <p className="text-xs text-amber-700 leading-relaxed">
          When you deactivate an option, existing users who selected it keep their value (it still displays on their profile).
          New users won't see it in dropdowns. Filters still show it if active users have it.
          Deleting permanently removes the option — users with that value will show the raw key instead of the label.
        </p>
      </div>
    </div>
  )
}
