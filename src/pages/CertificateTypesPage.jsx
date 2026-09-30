import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { adminAPI } from '../lib/api'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'

const emptyType = { field: '', name: { en: '', ar: '' }, isActive: true, order: 0 }

export default function CertificateTypesPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [types, setTypes] = useState([])
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyType)
  const [saving, setSaving] = useState(false)

  const fetchTypes = async () => {
    setLoading(true)
    try {
      const [typesRes, fieldsRes] = await Promise.all([
        adminAPI.getCertificateTypes(),
        adminAPI.getCertificateFields(),
      ])
      setTypes(typesRes.data.data || [])
      setFields(fieldsRes.data.data || [])
    } catch (err) {
      console.error('Failed to fetch certificate types:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyType)
    setShowModal(true)
  }

  const openEdit = (type) => {
    setEditing(type)
    setForm({
      field: type.field?._id || type.field || '',
      name: type.name || { en: '', ar: '' },
      isActive: type.isActive,
      order: type.order || 0,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.field) {
      showToast({ type: 'error', text: 'Please select a parent field first' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, order: Number(form.order) }
      if (editing) {
        await adminAPI.updateCertificateType(editing._id, payload)
      } else {
        await adminAPI.createCertificateType(payload)
      }
      setShowModal(false)
      fetchTypes()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this certificate type?'))) return
    try {
      await adminAPI.deleteCertificateType(id)
      fetchTypes()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificate Types by Field</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Type
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No certificate types yet</p>
          <button
            onClick={openCreate}
            className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
          >
            Create First Type
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Field</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name (EN)</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name (AR)</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Order</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{type.field?.name?.en || '—'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{type.name?.en}</td>
                  <td className="px-6 py-4 text-gray-600" dir="rtl">{type.name?.ar}</td>
                  <td className="px-6 py-4 text-gray-600">{type.order}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        type.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(type)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary-50 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type._id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Type' : 'Create Type'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
                <select
                  value={form.field}
                  onChange={(e) => setForm({ ...form, field: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select field</option>
                  {fields.map((field) => (
                    <option key={field._id} value={field._id}>
                      {field.name?.en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name (EN)</label>
                <input
                  value={form.name.en}
                  onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Food Safety"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name (AR)</label>
                <input
                  value={form.name.ar}
                  onChange={(e) => setForm({ ...form, name: { ...form.name, ar: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  dir="rtl"
                  placeholder="مثال: سلامة الغذاء"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
