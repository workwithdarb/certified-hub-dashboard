import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { FiCheck, FiX, FiChevronLeft, FiChevronRight, FiTrash2, FiRotateCcw } from 'react-icons/fi'
import { useToast } from '../components/ToastProvider'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Deleted', value: 'deleted' },
]

export default function CertificatesPage() {
  const { showToast } = useToast()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [selected, setSelected] = useState([]) // certificate ids
  const [rejectTarget, setRejectTarget] = useState(null) // array of ids being rejected
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchCertificates = async (page = 1) => {
    setLoading(true)
    setSelected([])
    try {
      const params = { page, limit: 20 }
      if (filter === 'deleted') params.deleted = true
      else if (filter) params.status = filter
      const res = await adminAPI.getCertificates(params)
      setCertificates(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      console.error('Failed to fetch certificates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const toggleOne = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const allVisibleSelected = certificates.length > 0 && certificates.every((c) => selected.includes(c._id))
  const toggleAll = () =>
    setSelected(allVisibleSelected ? [] : certificates.map((c) => c._id))

  const verifyMany = async (ids) => {
    setBusy(true)
    try {
      await Promise.all(ids.map((id) => adminAPI.verifyCertificate(id, { isVerified: true })))
      showToast({ type: 'success', text: ids.length > 1 ? `${ids.length} certificates verified` : 'Certificate verified' })
      fetchCertificates(pagination.page)
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to verify' })
    } finally {
      setBusy(false)
    }
  }

  const openReject = (ids) => {
    setRejectReason('')
    setRejectTarget(ids)
  }

  const submitReject = async () => {
    const ids = rejectTarget || []
    setBusy(true)
    try {
      await Promise.all(
        ids.map((id) => adminAPI.verifyCertificate(id, { isVerified: false, rejectionReason: rejectReason.trim() }))
      )
      showToast({ type: 'success', text: ids.length > 1 ? `${ids.length} certificates rejected` : 'Certificate rejected' })
      setRejectTarget(null)
      fetchCertificates(pagination.page)
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to reject' })
    } finally {
      setBusy(false)
    }
  }

  const deleteMany = async (ids, permanent = false) => {
    const msg = permanent
      ? `Permanently delete ${ids.length} certificate(s)? This cannot be undone.`
      : `Delete ${ids.length} certificate(s)? You can restore them from the Deleted tab.`
    if (!window.confirm(msg)) return
    setBusy(true)
    try {
      await Promise.all(ids.map((id) => adminAPI.deleteCertificate(id, permanent)))
      showToast({ type: 'success', text: ids.length > 1 ? `${ids.length} certificates deleted` : 'Certificate deleted' })
      fetchCertificates(pagination.page)
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    } finally {
      setBusy(false)
    }
  }

  const restoreMany = async (ids) => {
    setBusy(true)
    try {
      await Promise.all(ids.map((id) => adminAPI.restoreCertificate(id)))
      showToast({ type: 'success', text: ids.length > 1 ? `${ids.length} certificates restored` : 'Certificate restored' })
      fetchCertificates(pagination.page)
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to restore' })
    } finally {
      setBusy(false)
    }
  }

  const isDeletedView = filter === 'deleted'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <span className="text-sm text-gray-500">{pagination.total} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-gray-700">{selected.length} selected</span>
          <div className="flex gap-2 ms-auto">
            {isDeletedView ? (
              <>
                <button onClick={() => restoreMany(selected)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  <FiRotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button onClick={() => deleteMany(selected, true)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  <FiTrash2 className="w-3.5 h-3.5" /> Delete permanently
                </button>
              </>
            ) : (
              <>
                <button onClick={() => verifyMany(selected)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  <FiCheck className="w-3.5 h-3.5" /> Verify
                </button>
                <button onClick={() => openReject(selected)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                  <FiX className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => deleteMany(selected)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  <FiTrash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
                </th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Field</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Photo</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : certificates.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No certificates found</td></tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.includes(cert._id)} onChange={() => toggleOne(cert._id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{cert.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{cert.user?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{cert.certificateType?.name?.en || cert.certificateType?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{cert.field?.name?.en || '—'}</td>
                    <td className="px-6 py-4">
                      {cert.certificatePhoto ? (
                        <a href={cert.certificatePhoto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">View Photo</a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          cert.status === 'verified' ? 'bg-green-50 text-green-700' :
                          cert.status === 'rejected' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {cert.status === 'verified' ? 'Verified' : cert.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                      {cert.status === 'rejected' && cert.rejectionReason && (
                        <p className="mt-1 max-w-[220px] text-[10px] text-gray-400" title={cert.rejectionReason}>Reason: {cert.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {isDeletedView ? (
                          <>
                            <button onClick={() => restoreMany([cert._id])} disabled={busy} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50" title="Restore">
                              <FiRotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteMany([cert._id], true)} disabled={busy} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50" title="Delete permanently">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {cert.status !== 'verified' && (
                              <button onClick={() => verifyMany([cert._id])} disabled={busy} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50" title="Verify">
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                            {cert.status !== 'rejected' && (
                              <button onClick={() => openReject([cert._id])} disabled={busy} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-50" title="Reject">
                                <FiX className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => deleteMany([cert._id])} disabled={busy} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50" title="Delete Certificate">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchCertificates(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => fetchCertificates(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rejection reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Reject {rejectTarget.length > 1 ? `${rejectTarget.length} certificates` : 'certificate'}
              </h3>
              <button onClick={() => setRejectTarget(null)} className="text-gray-400 hover:text-gray-600"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason (sent to the applicant)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. The certificate image is unclear. Please re-upload a clearer copy."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-[11px] text-gray-400">The applicant will receive this reason by email.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button onClick={() => setRejectTarget(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={submitReject} disabled={busy} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
