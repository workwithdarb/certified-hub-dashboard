import { useState, useEffect } from 'react'
import { useConfirm } from '../components/ConfirmProvider'
import { useToast } from '../components/ToastProvider'
import { coursesAPI, courseCategoriesAPI } from '../lib/api'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronUp, FiChevronDown, FiYoutube, FiEye, FiEyeOff, FiUpload } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const emptyLesson = { title: { en: '', ar: '' }, youtubeUrl: '', duration: 0 }

const emptyCourse = {
  title: { en: '', ar: '' },
  description: { en: '', ar: '' },
  thumbnail: '',
  category: '',
  price: 0,
  currency: 'AED',
  instructor: { en: '', ar: '' },
  lessons: [],
  isPublished: false,
  order: 0,
}

export default function CoursesPage() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCourse)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('details') // 'details' | 'lessons'
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const navigate = useNavigate()

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await coursesAPI.getAll()
      setCourses(res.data.data || [])
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
    courseCategoriesAPI.getAll()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(JSON.parse(JSON.stringify(emptyCourse)))
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setTab('details')
    setShowModal(true)
  }

  const openEdit = (course) => {
    setEditing(course)
    setForm({
      title: course.title || { en: '', ar: '' },
      description: course.description || { en: '', ar: '' },
      thumbnail: course.thumbnail || '',
      category: course.category?._id || course.category || '',
      price: course.price || 0,
      currency: course.currency || 'AED',
      instructor: course.instructor || { en: '', ar: '' },
      lessons: (course.lessons || []).map((l) => ({
        title: l.title || { en: '', ar: '' },
        youtubeUrl: l.youtubeUrl || '',
        duration: l.duration || 0,
      })),
      isPublished: course.isPublished || false,
      order: course.order || 0,
    })
    setThumbnailFile(null)
    setThumbnailPreview(course.thumbnail || null)
    setTab('details')
    setShowModal(true)
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const lessons = form.lessons.map((l, i) => ({
        ...l,
        duration: Number(l.duration),
        order: i,
      }))

      // Use FormData to support file upload
      const fd = new FormData()
      fd.append('title[en]', form.title.en)
      fd.append('title[ar]', form.title.ar)
      fd.append('description[en]', form.description.en)
      fd.append('description[ar]', form.description.ar)
      fd.append('instructor[en]', form.instructor.en)
      fd.append('instructor[ar]', form.instructor.ar)
      if (form.category) fd.append('category', form.category)
      fd.append('price', Number(form.price))
      fd.append('currency', form.currency)
      fd.append('order', Number(form.order))
      fd.append('isPublished', form.isPublished)
      fd.append('lessons', JSON.stringify(lessons))

      if (thumbnailFile) {
        fd.append('thumbnail', thumbnailFile)
      }
      // Don't append thumbnail if no file - let backend handle default

      if (editing) {
        await coursesAPI.update(editing._id, fd)
      } else {
        await coursesAPI.create(fd)
      }
      setShowModal(false)
      fetchCourses()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to save course' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this course and all its enrollments?'))) return
    try {
      await coursesAPI.delete(id)
      fetchCourses()
    } catch (err) {
      showToast({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    }
  }

  // Lesson helpers
  const addLesson = () => {
    setForm({ ...form, lessons: [...form.lessons, { ...emptyLesson, title: { en: '', ar: '' } }] })
  }

  const updateLesson = (idx, field, value) => {
    const updated = [...form.lessons]
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      updated[idx] = { ...updated[idx], [parent]: { ...updated[idx][parent], [child]: value } }
    } else {
      updated[idx] = { ...updated[idx], [field]: value }
    }
    setForm({ ...form, lessons: updated })
  }

  const removeLesson = (idx) => {
    setForm({ ...form, lessons: form.lessons.filter((_, i) => i !== idx) })
  }

  const moveLesson = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= form.lessons.length) return
    const updated = [...form.lessons]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    setForm({ ...form, lessons: updated })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/course-categories')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Manage Categories
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No courses yet</p>
          <button
            onClick={openCreate}
            className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
          >
            Create First Course
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Title (EN)</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Lessons</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Price</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnail && (
                        <img src={course.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{course.title?.en}</p>
                        <p className="text-xs text-gray-400">{course.instructor?.en}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{course.lessons?.length || 0}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {course.isFree ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      `${course.price} ${course.currency}`
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        course.isPublished ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(course)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary-50 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Course' : 'Create Course'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 shrink-0">
              <button
                onClick={() => setTab('details')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'details' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Course Details
              </button>
              <button
                onClick={() => setTab('lessons')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'lessons' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lessons ({form.lessons.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {tab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title (EN) *</label>
                      <input
                        value={form.title.en}
                        onChange={(e) => setForm({ ...form, title: { ...form.title, en: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Course title in English"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title (AR) *</label>
                      <input
                        value={form.title.ar}
                        onChange={(e) => setForm({ ...form, title: { ...form.title, ar: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        dir="rtl"
                        placeholder="عنوان الدورة بالعربية"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description (EN)</label>
                      <textarea
                        value={form.description.en}
                        onChange={(e) => setForm({ ...form, description: { ...form.description, en: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={3}
                        placeholder="Course description..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description (AR)</label>
                      <textarea
                        value={form.description.ar}
                        onChange={(e) => setForm({ ...form, description: { ...form.description, ar: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={3}
                        dir="rtl"
                        placeholder="وصف الدورة..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Instructor (EN)</label>
                      <input
                        value={form.instructor.en}
                        onChange={(e) => setForm({ ...form, instructor: { ...form.instructor, en: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Instructor name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Instructor (AR)</label>
                      <input
                        value={form.instructor.ar}
                        onChange={(e) => setForm({ ...form, instructor: { ...form.instructor, ar: e.target.value } })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        dir="rtl"
                        placeholder="اسم المدرب"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— No Category —</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name?.en}{cat.name?.ar ? ` / ${cat.name.ar}` : ''}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No categories yet — create them in the Categories tab first.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Thumbnail</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                        <FiUpload className="w-4 h-4" />
                        {thumbnailFile ? 'Change Image' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="hidden"
                        />
                      </label>
                      {thumbnailFile && (
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">{thumbnailFile.name}</span>
                      )}
                    </div>
                    {thumbnailPreview && (
                      <img src={thumbnailPreview} alt="preview" className="mt-2 w-40 h-24 rounded-lg object-cover border border-gray-200" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                      <input
                        type="number"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Published</span>
                    </label>
                  </div>
                </div>
              )}

              {tab === 'lessons' && (
                <div className="space-y-3">
                  {form.lessons.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No lessons yet. Add your first lesson below.</p>
                  )}

                  {form.lessons.map((lesson, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Lesson {idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveLesson(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <FiChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveLesson(idx, 1)}
                            disabled={idx === form.lessons.length - 1}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <FiChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeLesson(idx)}
                            className="p-1 rounded text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Title (EN)</label>
                          <input
                            value={lesson.title.en}
                            onChange={(e) => updateLesson(idx, 'title.en', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Lesson title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Title (AR)</label>
                          <input
                            value={lesson.title.ar}
                            onChange={(e) => updateLesson(idx, 'title.ar', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            dir="rtl"
                            placeholder="عنوان الدرس"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          <FiYoutube className="inline w-3 h-3 mr-1 text-red-500" />
                          YouTube URL
                        </label>
                        <input
                          value={lesson.youtubeUrl}
                          onChange={(e) => updateLesson(idx, 'youtubeUrl', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
                        <input
                          type="number"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(idx, 'duration', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addLesson}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
                  >
                    <FiPlus className="inline w-4 h-4 mr-1" />
                    Add Lesson
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
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
                {saving ? 'Saving...' : editing ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
