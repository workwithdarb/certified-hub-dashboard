import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi'

export default function IndividualsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [expandedUser, setExpandedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState('')

  const toggleSuspend = async (user) => {
    const next = !user.isSuspended
    const ok = window.confirm(
      next
        ? `Suspend ${user.name}? They will not be able to sign in.`
        : `Reactivate ${user.name}?`
    )
    if (!ok) return
    setActionLoading(user._id)
    try {
      await adminAPI.setUserSuspended(user._id, next)
      fetchUsers(pagination.page)
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading('')
    }
  }

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 20, role: 'individual' }
      if (search) params.search = search
      const res = await adminAPI.getUsers(params)
      setUsers(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(1), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  const getExperienceLabel = (val) => {
    const map = {
      '0': '0-1 years',
      '1': '1-3 years',
      '3': '3-5 years',
      '5': '5-10 years',
      '10': '10+ years',
    }
    return map[val] || val || '—'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Individual Users</h1>
        <span className="text-sm text-gray-500">{pagination.total} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, job..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500 w-8"></th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Experience</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nationality</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Availability</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Verified</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                    No individual users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <>
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpand(user._id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedUser === user._id ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.phones?.length > 0 
                          ? user.phones.map(p => `${p.countryCode || '+971'} ${p.number}`).join(', ')
                          : user.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.job || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{getExperienceLabel(user.yearsOfExperience)}</td>
                      <td className="px-6 py-4 text-gray-600">{user.nationality || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{user.availabilityToJoin || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.isEmailVerified
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {user.isEmailVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSuspend(user)}
                          disabled={actionLoading === user._id}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border disabled:opacity-50 ${
                            user.isSuspended
                              ? 'border-green-300 text-green-700 hover:bg-green-50'
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {user.isSuspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                    {expandedUser === user._id && (
                      <tr key={`${user._id}-details`} className="bg-gray-50">
                        <td colSpan={11} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Gender</p>
                              <p className="text-gray-900 capitalize">{user.gender || '—'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Location</p>
                              <p className="text-gray-900">{user.location || '—'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Profile Photo</p>
                              {user.profilePhoto ? (
                                <a href={user.profilePhoto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>
                              ) : (
                                <p className="text-gray-400">None</p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Last Updated</p>
                              <p className="text-gray-900">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
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
