import { useState, useEffect } from 'react'
import { adminAPI } from '../lib/api'
import { useToast } from '../components/ToastProvider'

export default function BookingsPage() {
  const { showToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState('')

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getBookings()
      setBookings(res.data.data || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { fetchBookings() }, [])

  const update = async (b, changes) => {
    setActionId(b._id)
    try {
      await adminAPI.updateBooking(b._id, changes)
      showToast({ type: 'success', text: 'Booking updated' })
      fetchBookings()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Update failed' })
    } finally { setActionId('') }
  }

  const statusBadge = (s) =>
    s === 'confirmed' ? 'bg-green-50 text-green-700' : s === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam Bookings</h1>
        <span className="text-sm text-gray-500">{bookings.length} total</span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">No bookings yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Attendee</th>
                  <th className="px-6 py-3 font-medium">Center</th>
                  <th className="px-6 py-3 font-medium">Exam</th>
                  <th className="px-6 py-3 font-medium">When</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{b.userName || '—'}</p>
                      <p className="text-xs text-gray-400">{b.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.center?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{b.examName}</td>
                    <td className="px-6 py-4 text-gray-600">{b.startAt ? new Date(b.startAt).toLocaleString() : '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{b.price > 0 ? `${b.price} ${b.currency}` : 'Free'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => update(b, { paymentStatus: b.paymentStatus === 'paid' ? 'unpaid' : 'paid' })}
                        disabled={actionId === b._id}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={b.status}
                        disabled={actionId === b._id}
                        onChange={(e) => update(b, { status: e.target.value })}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize border-0 focus:ring-2 focus:ring-primary/30 ${statusBadge(b.status)}`}
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
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
