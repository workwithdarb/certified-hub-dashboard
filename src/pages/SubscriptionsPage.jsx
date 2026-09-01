import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [actionLoading, setActionLoading] = useState('')

  const fetchSubscriptions = (page = 1) => {
    setLoading(true)
    const params = { page, limit: 20 }
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.subscriberType = typeFilter
    adminAPI.getSubscriptions(params)
      .then((res) => {
        setSubscriptions(res.data.data || [])
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
      })
      .catch((err) => console.error('Failed to fetch subscriptions:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSubscriptions(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter])

  const getSubscriberName = (sub) => {
    if (!sub.subscriberId) return '—'
    if (sub.subscriberType === 'company') {
      return sub.subscriberId?.companyName || sub.subscriberId?.officialEmail || '—'
    }
    return sub.subscriberId?.name || sub.subscriberId?.email || '—'
  }

  const getSubscriberEmail = (sub) => {
    if (!sub.subscriberId) return ''
    if (sub.subscriberType === 'company') return sub.subscriberId?.officialEmail || ''
    return sub.subscriberId?.email || ''
  }

  const statusColors = {
    active: 'bg-green-50 text-green-700',
    trialing: 'bg-blue-50 text-blue-600',
    past_due: 'bg-amber-50 text-amber-600',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-50 text-red-600',
  }

  const statusLabels = {
    active: 'Active',
    trialing: 'Trialing',
    past_due: 'Past Due',
    expired: 'Expired',
    cancelled: 'Cancelled',
  }

  // The stored status can lag behind reality (e.g. an "active" row whose
  // endDate already passed). Compute what the subscription actually is
  // right now so the badge reads Expired/Active truthfully.
  const getEffectiveStatus = (sub) => {
    if (sub.status === 'cancelled') return 'cancelled'
    const end = sub.endDate ? new Date(sub.endDate).getTime() : null
    if (end && end < Date.now()) return 'expired'
    return sub.status
  }

  // "ends in 12d" / "ended 3d ago" — small hint under the badge.
  const getExpiryHint = (sub) => {
    if (!sub.endDate || sub.status === 'cancelled') return null
    const diffDays = Math.round((new Date(sub.endDate).getTime() - Date.now()) / 86400000)
    if (diffDays < 0) return `ended ${Math.abs(diffDays)}d ago`
    if (diffDays === 0) return 'ends today'
    return `ends in ${diffDays}d`
  }

  const runSubscriptionAction = async (id, action) => {
    setActionLoading(id)
    try {
      await action()
      fetchSubscriptions(pagination.page)
    } catch (err) {
      alert(err.response?.data?.message || 'Subscription action failed')
    } finally {
      setActionLoading('')
    }
  }

  const updateStatus = (sub) => {
    const status = prompt('Enter status: active, trialing, past_due, expired, cancelled', sub.status)
    if (!status) return
    runSubscriptionAction(sub._id, () => adminAPI.updateSubscriptionStatus(sub._id, { status }))
  }

  const extendSub = (sub) => {
    const days = Number(prompt('Extend by how many days?', '30'))
    if (!Number.isInteger(days) || days < 1) return
    runSubscriptionAction(sub._id, () => adminAPI.extendSubscription(sub._id, { days }))
  }

  const changePlan = (sub) => {
    const planId = prompt('Enter replacement plan ID')
    if (!planId) return
    runSubscriptionAction(sub._id, () => adminAPI.changeSubscriptionPlan(sub._id, { planId }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <span className="text-sm text-gray-500">{pagination.total} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'All', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Trialing', value: 'trialing' },
          { label: 'Past Due', value: 'past_due' },
          { label: 'Expired', value: 'expired' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All Types', value: '' },
          { label: 'Users', value: 'user' },
          { label: 'Companies', value: 'company' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === tab.value
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Subscriber</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Plan</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Period</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Usage</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{getSubscriberName(sub)}</p>
                        <p className="text-xs text-gray-500">{getSubscriberEmail(sub)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.subscriberType === 'company' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {sub.subscriberType === 'company' ? 'Company' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{sub.plan?.name?.en || '—'}</p>
                      {sub.isTrial && <span className="text-xs text-amber-600">Trial</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      <p>{new Date(sub.startDate).toLocaleDateString()}</p>
                      <p className="text-gray-400">{new Date(sub.endDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {sub.subscriberType === 'user' ? (
                        <p>Certs: {sub.certificatesAddedThisMonth}{sub.plan?.maxCertificatesPerMonth !== -1 ? `/${sub.plan?.maxCertificatesPerMonth}` : '/∞'}</p>
                      ) : (
                        <p>Views: {sub.contactViewsUsedThisMonth}{sub.plan?.maxContactViewsPerMonth !== -1 ? `/${sub.plan?.maxContactViewsPerMonth}` : '/∞'}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const eff = getEffectiveStatus(sub)
                        const hint = getExpiryHint(sub)
                        return (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[eff] || 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {statusLabels[eff] || eff}
                            </span>
                            {eff !== sub.status && (
                              <p className="text-[10px] text-gray-400">stored: {sub.status}</p>
                            )}
                            {hint && (
                              <p className={`text-[10px] ${eff === 'expired' ? 'text-red-500' : 'text-gray-400'}`}>{hint}</p>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => updateStatus(sub)}
                          disabled={actionLoading === sub._id}
                          className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => extendSub(sub)}
                          disabled={actionLoading === sub._id}
                          className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Extend
                        </button>
                        <button
                          onClick={() => changePlan(sub)}
                          disabled={actionLoading === sub._id}
                          className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Plan
                        </button>
                        <button
                          onClick={() => runSubscriptionAction(sub._id, () => adminAPI.resetSubscriptionUsage(sub._id))}
                          disabled={actionLoading === sub._id}
                          className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Reset
                        </button>
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
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSubscriptions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchSubscriptions(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
