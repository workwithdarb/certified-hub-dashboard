import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [actionLoading, setActionLoading] = useState('')

  const toggleSuspend = async (c) => {
    const next = !c.isSuspended
    const ok = window.confirm(
      next
        ? `Suspend ${c.companyName}? They will not be able to sign in.`
        : `Reactivate ${c.companyName}?`
    )
    if (!ok) return
    setActionLoading(c._id)
    try {
      await adminAPI.setCompanySuspended(c._id, next)
      fetchCompanies(pagination.page)
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading('')
    }
  }

  const fetchCompanies = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (search) params.search = search
      const res = await adminAPI.getCompanies(params)
      setCompanies(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      console.error('Failed to fetch companies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => fetchCompanies(1), 300)
    return () => clearTimeout(timeout)
  }, [search])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <span className="text-sm text-gray-500">{pagination.total} total</span>
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Company</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Staff #</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Subscription</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Joined</th>
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
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.companyName}</td>
                    <td className="px-6 py-4 text-gray-600">{c.officialEmail}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.phone ? `${c.countryCode || ''} ${c.phone}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.registeredStaffNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.subscription
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.subscription ? 'Active' : 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSuspend(c)}
                        disabled={actionLoading === c._id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border disabled:opacity-50 ${
                          c.isSuspended
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : 'border-red-300 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {c.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
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
                onClick={() => fetchCompanies(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchCompanies(pagination.page + 1)}
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
