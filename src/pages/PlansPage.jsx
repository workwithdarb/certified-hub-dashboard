import { useState, useEffect } from 'react'
import { adminAPI, plansAPI, coursesAPI } from '../lib/api'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUsers, FiBriefcase } from 'react-icons/fi'
import CoursePlansPage from './CoursePlansPage'

const emptyPlan = {
  name: { en: '', ar: '' },
  description: { en: '', ar: '' },
  targetAudience: 'individual',
  price: '',
  currency: 'AED',
  duration: 30,
  features: { en: [''], ar: [''] },
  maxCertificatesPerMonth: -1,
  maxContactViewsPerMonth: -1,
  maxEmployees: -1,
  stripePriceId: '',
  trialDurationDays: 0,
  isTrial: false,
  isActive: true,
  order: 0,
  includedCourses: [],
  allCoursesIncluded: false,
  marketingBadge: 'none',
  discountPercent: 0,
}

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [form, setForm] = useState(emptyPlan)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('individual')
  const [companyPlanType, setCompanyPlanType] = useState('registry')
  const [existingTrial, setExistingTrial] = useState({ individual: null, company: null })
  const [allCourses, setAllCourses] = useState([])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await plansAPI.getAll()
      const allPlans = res.data.data || []
      setPlans(allPlans)
      // Track existing trial plans per audience
      const individualTrial = allPlans.find(p => p.isTrial && p.targetAudience === 'individual')
      const companyTrial = allPlans.find(p => p.isTrial && p.targetAudience === 'company')
      setExistingTrial({ individual: individualTrial || null, company: companyTrial || null })
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    const fetchCourses = async () => {
      try {
        const res = await coursesAPI.getAll()
        setAllCourses(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch courses:', err)
      }
    }
    fetchCourses()
  }, [])

  const openEdit = (plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name || { en: '', ar: '' },
      description: plan.description || { en: '', ar: '' },
      targetAudience: plan.targetAudience || 'individual',
      price: plan.price,
      currency: plan.currency || 'AED',
      duration: plan.duration,
      features: plan.features || { en: [''], ar: [''] },
      maxCertificatesPerMonth: plan.maxCertificatesPerMonth ?? -1,
      maxContactViewsPerMonth: plan.maxContactViewsPerMonth ?? -1,
      maxEmployees: plan.maxEmployees ?? -1,
      stripePriceId: plan.stripePriceId || '',
      trialDurationDays: plan.trialDurationDays || 0,
      isTrial: plan.isTrial || false,
      isActive: plan.isActive,
      order: plan.order || 0,
      includedCourses: (plan.includedCourses || []).map(c => typeof c === 'object' ? c._id : c),
      allCoursesIncluded: plan.allCoursesIncluded || false,
      marketingBadge: plan.marketingBadge || 'none',
      discountPercent: plan.discountPercent || 0,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    // Validation
    if (!form.isTrial && Number(form.price) <= 0) {
      alert('Price must be greater than 0 for non-trial plans. Enable "Free Trial Plan" if this is a trial plan.')
      setSaving(false)
      return
    }

    const validateLimit = (value, fieldName) => {
      const num = Number(value)
      if (num < -1) {
        return `${fieldName} cannot be less than -1. Use -1 for unlimited.`
      }
      return null
    }

    const limitErrors = [
      validateLimit(form.maxCertificatesPerMonth, 'Max Certificates'),
      validateLimit(form.maxContactViewsPerMonth, 'Max Contact Views'),
      validateLimit(form.maxEmployees, 'Max Employees'),
    ].filter(Boolean)

    if (limitErrors.length > 0) {
      alert(limitErrors.join('\n'))
      setSaving(false)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
        maxCertificatesPerMonth: Number(form.maxCertificatesPerMonth),
        maxContactViewsPerMonth: Number(form.maxContactViewsPerMonth),
        maxEmployees: Number(form.maxEmployees),
        trialDurationDays: Number(form.trialDurationDays),
        order: Number(form.order),
        includedCourses: form.allCoursesIncluded ? [] : form.includedCourses,
        allCoursesIncluded: form.allCoursesIncluded,
        marketingBadge: form.marketingBadge || 'none',
        discountPercent: Number(form.discountPercent || 0),
        features: {
          en: form.features.en.filter((f) => f.trim()),
          ar: form.features.ar.filter((f) => f.trim()),
        },
      }

      if (editingPlan) {
        await adminAPI.updatePlan(editingPlan._id, payload)
      } else {
        await adminAPI.createPlan(payload)
      }
      setShowModal(false)
      fetchPlans()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      await adminAPI.deletePlan(id)
      fetchPlans()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan')
    }
  }

  const updateFeature = (lang, idx, value) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: prev.features[lang].map((f, i) => (i === idx ? value : f)),
      },
    }))
  }

  const addFeature = (lang) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: [...prev.features[lang], ''],
      },
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        {!(activeTab === 'company' && companyPlanType === 'courses') && (
          <button
            onClick={() => {
              setForm({ ...emptyPlan, targetAudience: activeTab })
              setEditingPlan(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add {activeTab === 'company' ? 'Company' : 'Individual'} Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('individual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'individual'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FiUsers className="w-4 h-4" />
          Individual Plans
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'company'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FiBriefcase className="w-4 h-4" />
          Company Plans
        </button>
      </div>

      {activeTab === 'company' && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCompanyPlanType('registry')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              companyPlanType === 'registry'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Registry Plans
          </button>
          <button
            onClick={() => setCompanyPlanType('courses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              companyPlanType === 'courses'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Course Plans
          </button>
        </div>
      )}

      {activeTab === 'company' && companyPlanType === 'courses' ? (
        <CoursePlansPage />
      ) : (
        <>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : plans.filter((p) => p.targetAudience === activeTab).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No {activeTab} plans created yet</p>
          <button
            onClick={() => {
              setForm({ ...emptyPlan, targetAudience: activeTab })
              setEditingPlan(null)
              setShowModal(true)
            }}
            className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
          >
            Create First {activeTab === 'company' ? 'Company' : 'Individual'} Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.filter((p) => p.targetAudience === activeTab).map((plan) => (
            <div key={plan._id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{plan.name?.en}</h3>
                  <p className="text-xs text-gray-500">{plan.name?.ar}</p>
                </div>
                <div className="flex gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    plan.targetAudience === 'company' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {plan.targetAudience === 'company' ? 'Company' : 'Individual'}
                  </span>
                  {plan.isTrial && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Free Trial</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    plan.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {plan.marketingBadge && plan.marketingBadge !== 'none' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      {plan.marketingBadge === 'best-offer' ? 'Best Offer' :
                       plan.marketingBadge === 'popular' ? 'Popular' :
                       `${plan.discountPercent || 0}% Off`}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price}`}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {plan.duration} days
                {plan.isTrial && plan.trialDurationDays > 0 && ` · Trial: ${plan.trialDurationDays}d`}
              </p>
              <div className="space-y-1 mb-3 text-xs text-gray-500">
                {plan.targetAudience === 'individual' && (
                  <p>Certificates/mo: {plan.maxCertificatesPerMonth === -1 ? '∞' : plan.maxCertificatesPerMonth}</p>
                )}
                {plan.targetAudience === 'company' && (
                  <>
                    <p>Contact views/mo: {plan.maxContactViewsPerMonth === -1 ? '∞' : plan.maxContactViewsPerMonth}</p>
                    <p>Max employees: {plan.maxEmployees === -1 ? '∞' : plan.maxEmployees}</p>
                  </>
                )}
                {plan.stripePriceId && <p className="text-green-600">Stripe: ✓</p>}
              </div>
              {plan.features?.en?.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {plan.features.en.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600">• {f}</li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Free Trial Toggle - at top */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isTrial}
                    onChange={(e) => setForm({ ...form, isTrial: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-green-800">Free Trial Plan</span>
                    <p className="text-xs text-green-600">Enable this to create a free trial plan for new users</p>
                  </div>
                </label>
                {form.isTrial && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <label className="block text-xs font-medium text-green-700 mb-1">Trial Duration (days)</label>
                    <input
                      type="number"
                      value={form.trialDurationDays}
                      onChange={(e) => setForm({ ...form, trialDurationDays: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-green-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white"
                      placeholder="e.g., 7"
                    />
                  </div>
                )}
              </div>

              {/* Warning if trial already exists */}
              {form.isTrial && !editingPlan && existingTrial[form.targetAudience] && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    ⚠️ A free trial plan for <strong>{form.targetAudience}</strong> already exists ({existingTrial[form.targetAudience].name?.en}).
                    Only one free trial plan per audience is allowed.
                  </p>
                </div>
              )}

              {/* Marketing badge — the tag shown on the plan card on the public site */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Badge</label>
                  <select
                    value={form.marketingBadge}
                    onChange={(e) => setForm({ ...form, marketingBadge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="none">No badge</option>
                    <option value="popular">Most Popular</option>
                    <option value="best-offer">Best Offer</option>
                    <option value="discount">Discount</option>
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">"Free Trial" is controlled by the Free Trial toggle above.</p>
                </div>
                {form.marketingBadge === 'discount' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discountPercent}
                      onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (EN)</label>
                  <input
                    value={form.name.en}
                    onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (AR)</label>
                  <input
                    value={form.name.ar}
                    onChange={(e) => setForm({ ...form, name: { ...form.name, ar: e.target.value } })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description (EN)</label>
                  <input
                    value={form.description.en}
                    onChange={(e) => setForm({ ...form, description: { ...form.description, en: e.target.value } })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description (AR)</label>
                  <input
                    value={form.description.ar}
                    onChange={(e) => setForm({ ...form, description: { ...form.description, ar: e.target.value } })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Target Audience - auto-set from active tab, hidden */}
              <input type="hidden" value={form.targetAudience} />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="KWD">KWD - Kuwaiti Dinar</option>
                    <option value="QAR">QAR - Qatari Riyal</option>
                    <option value="BHD">BHD - Bahraini Dinar</option>
                    <option value="OMR">OMR - Omani Rial</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Plan Limits */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan Limits (-1 = unlimited)</p>
                {form.targetAudience === 'individual' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Certificates / Month</label>
                    <input
                      type="number"
                      value={form.maxCertificatesPerMonth}
                      onChange={(e) => setForm({ ...form, maxCertificatesPerMonth: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}
                {form.targetAudience === 'company' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max Contact Views / Month</label>
                      <input
                        type="number"
                        value={form.maxContactViewsPerMonth}
                        onChange={(e) => setForm({ ...form, maxContactViewsPerMonth: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max Employees</label>
                      <input
                        type="number"
                        value={form.maxEmployees}
                        onChange={(e) => setForm({ ...form, maxEmployees: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Course Access */}
              <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Course Access</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allCoursesIncluded}
                    onChange={(e) => setForm({ ...form, allCoursesIncluded: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">All Courses Included</span>
                </label>
                {!form.allCoursesIncluded && allCourses.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Select Specific Courses</label>
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2 bg-white">
                      {allCourses.map((course) => (
                        <label key={course._id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.includedCourses.includes(course._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, includedCourses: [...form.includedCourses, course._id] })
                              } else {
                                setForm({ ...form, includedCourses: form.includedCourses.filter(id => id !== course._id) })
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">{course.title?.en}</span>
                          {course.isFree && <span className="text-xs text-green-600">(Free)</span>}
                        </label>
                      ))}
                    </div>
                    {form.includedCourses.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{form.includedCourses.length} course(s) selected</p>
                    )}
                  </div>
                )}
              </div>

              {/* Features EN */}
              <div className="p-3 bg-amber-50 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Marketing Label</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Badge Type</label>
                    <select
                      value={form.marketingBadge}
                      onChange={(e) => setForm({ ...form, marketingBadge: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="none">None</option>
                      <option value="popular">Popular Plan</option>
                      <option value="best-offer">Best Offer</option>
                      <option value="discount">Discount</option>
                    </select>
                  </div>
                  {form.marketingBadge === 'discount' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={form.discountPercent}
                        onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Features EN */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Features (EN)</label>
                {form.features.en.map((f, i) => (
                  <input
                    key={i}
                    value={f}
                    onChange={(e) => updateFeature('en', i, e.target.value)}
                    placeholder={`Feature ${i + 1}`}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ))}
                <button onClick={() => addFeature('en')} className="text-xs text-primary hover:underline">
                  + Add feature
                </button>
              </div>

              {/* Features AR */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Features (AR)</label>
                {form.features.ar.map((f, i) => (
                  <input
                    key={i}
                    value={f}
                    onChange={(e) => updateFeature('ar', i, e.target.value)}
                    placeholder={`ميزة ${i + 1}`}
                    dir="rtl"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ))}
                <button onClick={() => addFeature('ar')} className="text-xs text-primary hover:underline">
                  + Add feature
                </button>
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
                  {saving ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
