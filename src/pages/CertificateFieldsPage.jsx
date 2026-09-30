import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { adminAPI } from '../lib/api'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiTag } from 'react-icons/fi'

const emptyField = { name: { en: '', ar: '' }, isActive: true, order: 0 }

export default function CertificateFieldsPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyField)
  const [saving, setSaving] = useState(false)

  const fetchFields = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getCertificateFields()
      setFields(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch certificate fields:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFields() }, [])

  const openCreate = () => {
    setForm(emptyField)
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (field) => {
    setForm({
      name: field.name || { en: '', ar: '' },
      isActive: field.isActive !== false,
      order: field.order || 0,
    })
    setEditing(field._id)
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, order: Number(form.order) }
      if (editing) {
        await adminAPI.updateCertificateField(editing, payload)
      } else {
        await adminAPI.createCertificateField(payload)
      }
      setShowModal(false)
      fetchFields()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this certificate field?'))) return
    try {
      await adminAPI.deleteCertificateField(id)
      fetchFields()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificate Fields</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiTag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No certificate fields yet</p>
          <button
            onClick={openCreate}
            className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Add your first field
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name (EN)</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name (AR)</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Types</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Order</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{field.name?.en}</td>
                  <td className="px-6 py-4 text-gray-600" dir="rtl">{field.name?.ar}</td>
                  <td className="px-6 py-4 text-gray-600">{field.typeCount || field.types?.length || 0}</td>
                  <td className="px-6 py-4 text-gray-600">{field.order}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${field.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {field.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(field)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(field._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Field' : 'Add Field'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Name (English)</label>
                <input
                  value={form.name.en}
                  onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Food Safety"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Name (Arabic)</label>
                <input
                  dir="rtl"
                  value={form.name.ar}
                  onChange={(e) => setForm({ ...form, name: { ...form.name, ar: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="مثال: سلامة الغذاء"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                  />
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
