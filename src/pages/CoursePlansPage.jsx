import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ConfirmProvider'
import { coursePlansAPI, coursesAPI } from '../lib/api'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiPackage, FiBookOpen, FiDollarSign } from 'react-icons/fi'
import { useToast } from '../components/ToastProvider'

function getPlanCourseRules(plan) {
  if (plan.includedCourseRules?.length) {
    return plan.includedCourseRules.map((rule) => ({
      course: typeof rule.course === 'string' ? rule.course : rule.course?._id,
      employeeSeats: rule.employeeSeats ?? 1,
    })).filter((rule) => rule.course)
  }

  return (plan.includedCourses || []).map((course) => ({
    course: typeof course === 'string' ? course : course._id,
    employeeSeats: 1,
  })).filter((rule) => rule.course)
}

export default function CoursePlansPage() {
  const confirm = useConfirm()
  const [plans, setPlans] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = list view, 'new' = create, id = edit
  const [form, setForm] = useState(getEmptyForm())
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  function getEmptyForm() {
    return {
      name: { en: '', ar: '' },
      description: { en: '', ar: '' },
      targetAudience: 'company',
      price: '',
      currency: 'AED',
      duration: 30,
      includedCourses: [],
      includedCourseRules: [],
      features: { en: [''], ar: [''] },
      isActive: true,
      order: 0,
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansRes, coursesRes] = await Promise.all([
        coursePlansAPI.getAll(),
        coursesAPI.getAll(),
      ])
      setPlans(plansRes.data?.data || [])
      setCourses(coursesRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setForm(getEmptyForm())
    setEditing('new')
  }

  const handleEdit = (plan) => {
    setForm({
      name: plan.name || { en: '', ar: '' },
      description: plan.description || { en: '', ar: '' },
      targetAudience: plan.targetAudience || 'company',
      price: plan.price || '',
      currency: plan.currency || 'AED',
      duration: plan.duration || 30,
      includedCourseRules: getPlanCourseRules(plan),
      includedCourses: getPlanCourseRules(plan).map((rule) => rule.course),
      features: {
        en: plan.features?.en?.length ? [...plan.features.en] : [''],
        ar: plan.features?.ar?.length ? [...plan.features.ar] : [''],
      },
      isActive: plan.isActive !== false,
      order: plan.order || 0,
    })
    setEditing(plan._id)
  }

  const handleCancel = () => {
    setEditing(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
        order: Number(form.order),
        includedCourseRules: form.includedCourseRules.map((rule) => ({
          course: rule.course,
          employeeSeats: Math.max(0, Number(rule.employeeSeats || 0)),
        })),
        includedCourses: form.includedCourseRules.map((rule) => rule.course),
        features: {
          en: form.features.en.filter(Boolean),
          ar: form.features.ar.filter(Boolean),
        },
      }
      if (editing === 'new') {
        await coursePlansAPI.create(payload)
        showToast({ type: 'success', title: 'Plan created', text: 'The course plan was created successfully.' })
      } else {
        await coursePlansAPI.update(editing, payload)
        showToast({ type: 'success', title: 'Plan updated', text: 'The course plan was updated successfully.' })
      }
      await fetchData()
      setEditing(null)
    } catch (err) {
      showToast({
        type: 'error',
        title: "Couldn't save course plan",
        text: err.response?.data?.message || 'Save failed.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this course plan?'))) return
    try {
      await coursePlansAPI.delete(id)
      setPlans((prev) => prev.filter((p) => p._id !== id))
      showToast({ type: 'success', title: 'Plan deleted', text: 'The course plan was deleted.' })
    } catch {
      showToast({ type: 'error', title: 'Delete failed', text: 'The course plan could not be deleted.' })
    }
  }

  const toggleCourse = (courseId) => {
    setForm((prev) => {
      const current = prev.includedCourseRules || []
      if (current.some((rule) => rule.course === courseId)) {
        const nextRules = current.filter((rule) => rule.course !== courseId)
        return { ...prev, includedCourseRules: nextRules, includedCourses: nextRules.map((rule) => rule.course) }
      }
      const nextRules = [...current, { course: courseId, employeeSeats: 1 }]
      return { ...prev, includedCourseRules: nextRules, includedCourses: nextRules.map((rule) => rule.course) }
    })
  }

  const updateCourseSeats = (courseId, employeeSeats) => {
    setForm((prev) => {
      const nextRules = (prev.includedCourseRules || []).map((rule) =>
        rule.course === courseId ? { ...rule, employeeSeats } : rule
      )
      return { ...prev, includedCourseRules: nextRules, includedCourses: nextRules.map((rule) => rule.course) }
    })
  }

  const addFeature = (lang) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [lang]: [...prev.features[lang], ''] },
    }))
  }

  const removeFeature = (lang, idx) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: prev.features[lang].filter((_, i) => i !== idx),
      },
    }))
  }

  const updateFeature = (lang, idx, val) => {
    setForm((prev) => {
      const arr = [...prev.features[lang]]
      arr[idx] = val
      return { ...prev, features: { ...prev.features, [lang]: arr } }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // ========== FORM VIEW ==========
  if (editing !== null) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {editing === 'new' ? 'Create Course Plan' : 'Edit Course Plan'}
          </h1>
          <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Plan Name</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 block mb-0.5">English</span>
                <input value={form.name.en} onChange={(e) => setForm({ ...form, name: { ...form.name, en: e.target.value } })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Starter" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block mb-0.5">Arabic</span>
                <input dir="rtl" value={form.name.ar} onChange={(e) => setForm({ ...form, name: { ...form.name, ar: e.target.value } })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Description</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 block mb-0.5">English</span>
                <textarea value={form.description.en} onChange={(e) => setForm({ ...form, description: { ...form.description, en: e.target.value } })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block mb-0.5">Arabic</span>
                <textarea dir="rtl" value={form.description.ar} onChange={(e) => setForm({ ...form, description: { ...form.description, ar: e.target.value } })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          {/* Target Audience + Price + Currency + Duration */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Price</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="999" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
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
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Duration (days)</label>
              <input type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Active + Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active</label>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Included Courses */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Included Courses ({form.includedCourseRules.length} selected)
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-1.5">
              {courses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No courses available</p>
              ) : (
                courses.map((c) => {
                  const selectedRule = form.includedCourseRules.find((rule) => rule.course === c._id)

                  return (
                    <div key={c._id} className={`px-3 py-2 rounded-lg transition-colors ${selectedRule ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={Boolean(selectedRule)} onChange={() => toggleCourse(c._id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {c.thumbnail && <img src={c.thumbnail} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.title?.en}</p>
                            <p className="text-[10px] text-gray-400">{c.price === 0 ? 'Free' : `${c.price} ${c.currency}`}</p>
                          </div>
                        </div>
                      </label>
                      {selectedRule && (
                        <div className="mt-2 ms-7 grid grid-cols-[1fr_120px] items-center gap-3">
                          <p className="text-xs text-gray-500">Employee seats for this course. Company owner always has access.</p>
                          <input
                            type="number"
                            min="0"
                            value={selectedRule.employeeSeats}
                            onChange={(e) => updateCourseSeats(c._id, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-primary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Features EN */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Features (English)</label>
            <div className="space-y-2">
              {form.features.en.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input value={f} onChange={(e) => updateFeature('en', i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={`Feature ${i + 1}`} />
                  {form.features.en.length > 1 && (
                    <button onClick={() => removeFeature('en', i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => addFeature('en')} className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary-dark"><FiPlus className="w-3.5 h-3.5" /> Add Feature</button>
            </div>
          </div>

          {/* Features AR */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Features (Arabic)</label>
            <div className="space-y-2">
              {form.features.ar.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input dir="rtl" value={f} onChange={(e) => updateFeature('ar', i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={`ميزة ${i + 1}`} />
                  {form.features.ar.length > 1 && (
                    <button onClick={() => removeFeature('ar', i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => addFeature('ar')} className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary-dark"><FiPlus className="w-3.5 h-3.5" /> Add Feature</button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== LIST VIEW ==========
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Course Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage course bundle plans for companies</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
          <FiPlus className="w-4 h-4" />
          New Plan
        </button>
      </div>
      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No course plans yet</p>
          <button onClick={handleCreate} className="mt-3 text-sm text-primary font-medium hover:text-primary-dark">Create your first plan</button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{plan.name?.en}</h3>
                    {!plan.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{plan.name?.ar}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <FiDollarSign className="w-3.5 h-3.5" />
                      <strong>{plan.price}</strong> {plan.currency}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{plan.duration} days</span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <FiBookOpen className="w-3.5 h-3.5" />
                      {plan.includedCourses?.length || 0} courses
                    </span>
                  </div>
                  {/* Show course names */}
                  {plan.includedCourses?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {getPlanCourseRules(plan).map((rule) => {
                        const course = plan.includedCourses?.find((item) => item._id === rule.course)
                          || plan.includedCourseRules?.find((item) => item.course?._id === rule.course)?.course

                        return (
                        <span key={rule.course} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 font-medium">
                          {course?.title?.en || 'Course'} · {rule.employeeSeats} employee seats
                        </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleEdit(plan)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(plan._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
