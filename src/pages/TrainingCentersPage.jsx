import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiX } from 'react-icons/fi'

const emptyCenter = { name: '', logo: '', location: '', description: '', email: '', mobile: '', certificatesText: '', isActive: true, order: 0 }
const emptySlot = { examName: '', startAt: '', location: '', capacity: 1, price: 0, currency: 'AED' }

export default function TrainingCentersPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // center form
  const [saving, setSaving] = useState(false)

  const [slotsFor, setSlotsFor] = useState(null) // center being managed for slots
  const [slots, setSlots] = useState([])
  const [slotForm, setSlotForm] = useState(emptySlot)
  const [slotSaving, setSlotSaving] = useState(false)

  const fetchCenters = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getCenters()
      setCenters(res.data.data || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { fetchCenters() }, [])

  const openNew = () => setModal({ ...emptyCenter })
  const openEdit = (c) => setModal({
    _id: c._id, name: c.name || '', logo: c.logo || '', location: c.location || '',
    description: c.description || '', email: c.email || '', mobile: c.mobile || '',
    certificatesText: (c.certificates || []).join(', '), isActive: c.isActive !== false, order: c.order || 0,
  })

  const saveCenter = async () => {
    if (!modal.name.trim()) { showToast({ type: 'error', text: 'Center name is required' }); return }
    setSaving(true)
    try {
      const payload = {
        name: modal.name.trim(), logo: modal.logo.trim(), location: modal.location.trim(),
        description: modal.description.trim(), email: modal.email.trim(), mobile: modal.mobile.trim(),
        certificates: modal.certificatesText.split(',').map((s) => s.trim()).filter(Boolean),
        isActive: !!modal.isActive, order: Number(modal.order) || 0,
      }
      if (modal._id) await adminAPI.updateCenter(modal._id, payload)
      else await adminAPI.createCenter(payload)
      showToast({ type: 'success', text: 'Center saved' })
      setModal(null)
      fetchCenters()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to save center' })
    } finally { setSaving(false) }
  }

  const deleteCenter = async (c) => {
    if (!(await confirm({ title: 'Delete center', message: `Delete "${c.name}" and all its exam slots?`, confirmText: 'Delete', tone: 'danger' }))) return
    try {
      await adminAPI.deleteCenter(c._id)
      showToast({ type: 'success', text: 'Center deleted' })
      fetchCenters()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    }
  }

  const openSlots = async (c) => {
    setSlotsFor(c)
    setSlotForm(emptySlot)
    try {
      const res = await adminAPI.getCenterSlots(c._id)
      setSlots(res.data.data || [])
    } catch { setSlots([]) }
  }

  const addSlot = async () => {
    if (!slotForm.examName.trim() || !slotForm.startAt) { showToast({ type: 'error', text: 'Exam name and date/time are required' }); return }
    setSlotSaving(true)
    try {
      await adminAPI.createSlot(slotsFor._id, {
        examName: slotForm.examName.trim(), startAt: slotForm.startAt, location: slotForm.location.trim(),
        capacity: Number(slotForm.capacity) || 1, price: Number(slotForm.price) || 0, currency: slotForm.currency || 'AED',
      })
      const res = await adminAPI.getCenterSlots(slotsFor._id)
      setSlots(res.data.data || [])
      setSlotForm(emptySlot)
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to add slot' })
    } finally { setSlotSaving(false) }
  }

  const deleteSlot = async (slot) => {
    if (!(await confirm({ title: 'Delete slot', message: `Delete the "${slot.examName}" slot?`, confirmText: 'Delete', tone: 'danger' }))) return
    try {
      await adminAPI.deleteSlot(slot._id)
      setSlots((prev) => prev.filter((s) => s._id !== slot._id))
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to delete slot' })
    }
  }

  const input = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training Centers</h1>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark">
          <FiPlus className="w-4 h-4" /> Add Center
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading…</div>
      ) : centers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">No centers yet. Approve a partner application or add one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {centers.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/5">
                  {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-contain" /> : <FiCalendar className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">{c.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.isActive ? 'Active' : 'Hidden'}</span>
                  </div>
                  <p className="text-xs text-gray-500">{c.location || '—'}</p>
                  {(c.certificates || []).length > 0 && (
                    <p className="mt-1 text-xs text-gray-400 truncate">{c.certificates.join(' · ')}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <button onClick={() => openSlots(c)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border border-primary/30 text-primary hover:bg-primary/5"><FiCalendar className="w-3.5 h-3.5" /> Slots</button>
                <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"><FiEdit2 className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => deleteCenter(c)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50"><FiTrash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Center form modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setModal(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-bold text-gray-900">{modal._id ? 'Edit Center' : 'Add Center'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Name *</label><input className={input} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Logo URL</label><input className={input} value={modal.logo} onChange={(e) => setModal({ ...modal, logo: e.target.value })} placeholder="https://…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-gray-600">Location</label><input className={input} value={modal.location} onChange={(e) => setModal({ ...modal, location: e.target.value })} /></div>
                <div><label className="mb-1 block text-xs font-medium text-gray-600">Order</label><input type="number" className={input} value={modal.order} onChange={(e) => setModal({ ...modal, order: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-gray-600">Email</label><input className={input} value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></div>
                <div><label className="mb-1 block text-xs font-medium text-gray-600">Mobile</label><input className={input} value={modal.mobile} onChange={(e) => setModal({ ...modal, mobile: e.target.value })} /></div>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Certificates offered (comma-separated)</label><input className={input} value={modal.certificatesText} onChange={(e) => setModal({ ...modal, certificatesText: e.target.value })} placeholder="HACCP Level 2, Basic Food Safety, PIC" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600">Description</label><textarea rows={3} className={input} value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} /></div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={modal.isActive} onChange={(e) => setModal({ ...modal, isActive: e.target.checked })} className="rounded border-gray-300" /> Active (visible on the site)</label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button onClick={() => setModal(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveCenter} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Slots modal */}
      {slotsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSlotsFor(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-bold text-gray-900">Exam slots — {slotsFor.name}</h3>
              <button onClick={() => setSlotsFor(null)} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4">
              {/* Add slot */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Add a slot</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input className={input} placeholder="Exam name" value={slotForm.examName} onChange={(e) => setSlotForm({ ...slotForm, examName: e.target.value })} />
                  <input type="datetime-local" className={input} value={slotForm.startAt} onChange={(e) => setSlotForm({ ...slotForm, startAt: e.target.value })} />
                  <input className={input} placeholder="Location (optional)" value={slotForm.location} onChange={(e) => setSlotForm({ ...slotForm, location: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min="1" className={input} placeholder="Capacity" value={slotForm.capacity} onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })} />
                    <input type="number" min="0" className={input} placeholder="Price" value={slotForm.price} onChange={(e) => setSlotForm({ ...slotForm, price: e.target.value })} />
                    <input className={input} placeholder="AED" value={slotForm.currency} onChange={(e) => setSlotForm({ ...slotForm, currency: e.target.value })} />
                  </div>
                </div>
                <button onClick={addSlot} disabled={slotSaving} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">{slotSaving ? 'Adding…' : 'Add slot'}</button>
              </div>

              {/* Slot list */}
              <div className="mt-4 space-y-2">
                {slots.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">No slots yet.</p>
                ) : slots.map((s) => (
                  <div key={s._id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.examName}</p>
                      <p className="text-xs text-gray-500">{new Date(s.startAt).toLocaleString()} · {s.bookedCount}/{s.capacity} booked · {s.price > 0 ? `${s.price} ${s.currency}` : 'Free'}</p>
                    </div>
                    <button onClick={() => deleteSlot(s)} className="text-red-400 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
