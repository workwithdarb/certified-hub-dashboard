import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { adminAPI } from '../lib/api'
import { FiMail, FiUser, FiClock, FiTrash2, FiEye, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function ContactMessagesPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (filter !== 'all') params.status = filter
      const res = await adminAPI.getContactMessages(params)
      setMessages(res.data.data || [])
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [page, filter])

  const handleStatusChange = async (id, status) => {
    try {
      await adminAPI.updateContactMessageStatus(id, { status })
      fetchMessages()
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, status })
      }
    } catch (err) {
      showToast({ type: 'error', text: 'Failed to update status' })
    }
  }

  const handleDelete = async (id) => {
    if (!(await confirm('Are you sure you want to delete this message?'))) return
    try {
      await adminAPI.deleteContactMessage(id)
      fetchMessages()
      setSelectedMessage(null)
    } catch (err) {
      showToast({ type: 'error', text: 'Failed to delete message' })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'read': return 'bg-yellow-100 text-yellow-700'
      case 'replied': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{pagination.total} messages</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'new', 'read', 'replied'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No messages found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => {
                    setSelectedMessage(msg)
                    if (msg.status === 'new') {
                      handleStatusChange(msg._id, 'read')
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?._id === msg._id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{msg.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(msg.status)}`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{msg.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <FiMail className="w-3 h-3" />
                        <span>{msg.email}</span>
                        <span>•</span>
                        <FiClock className="w-3 h-3" />
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">From</label>
                  <p className="text-sm font-medium text-gray-900">{selectedMessage.name}</p>
                  <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Subject</label>
                  <p className="text-sm text-gray-900">{selectedMessage.subject}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Date</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedMessage.createdAt)}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {selectedMessage.message}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { status: 'new', icon: FiMail, label: 'New' },
                      { status: 'read', icon: FiEye, label: 'Read' },
                      { status: 'replied', icon: FiCheckCircle, label: 'Replied' },
                    ].map(({ status, icon: Icon, label }) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedMessage._id, status)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedMessage.status === status
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Message
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FiMail className="w-12 h-12 mb-3" />
              <p className="text-sm">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
