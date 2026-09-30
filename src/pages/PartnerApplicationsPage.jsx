import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function PartnerApplicationsPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [actionId, setActionId] = useState('')

  const fetchApps = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const res = await adminAPI.getPartnerApplications(params)
      setApps(res.data.data || [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const review = async (app, status) => {
    const label = status === 'approved' ? 'Approve' : 'Reject'
    const message =
      status === 'approved'
        ? `Approve "${app.centerName}"? An accredited center will be created for them.`
        : `Reject "${app.centerName}"?`
    if (!(await confirm({ title: `${label} application`, message, confirmText: label, tone: status === 'approved' ? 'primary' : 'danger' }))) return
    setActionId(app._id)
    try {
      await adminAPI.reviewPartnerApplication(app._id, status)
      showToast({ type: 'success', text: `Application ${status}` })
      fetchApps()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Action failed' })
    } finally {
      setActionId('')
    }
  }

  const statusBadge = (s) =>
    s === 'approved'
      ? 'bg-green-50 text-green-700'
      : s === 'rejected'
        ? 'bg-red-50 text-red-600'
        : 'bg-amber-50 text-amber-700'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partner Applications</h1>
        <span className="text-sm text-gray-500">{apps.length} shown</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading…</div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">No applications yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Center</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{app.centerName}</p>
                      {app.message && <p className="mt-1 max-w-xs text-xs text-gray-500">{app.message}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>{app.email}</p>
                      <p className="text-xs text-gray-400" dir="ltr">{app.mobile}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{app.location || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(app.status)}`}>{app.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {app.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => review(app, 'approved')}
                            disabled={actionId === app._id}
                            className="px-3 py-1 rounded-lg text-xs font-medium border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => review(app, 'rejected')}
                            disabled={actionId === app._id}
                            className="px-3 py-1 rounded-lg text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
