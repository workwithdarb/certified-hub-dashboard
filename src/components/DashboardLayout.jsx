import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { authAPI } from '../lib/api'
import {
  FiHome,
  FiUsers,
  FiAward,
  FiCreditCard,
  FiPackage,
  FiLogOut,
  FiMenu,
  FiX,
  FiTag,
  FiBookOpen,
  FiFileText,
  FiMail,
  FiBriefcase,
  FiGlobe,
  FiPhone,
  FiChevronDown,
  FiChevronUp,
  FiList,
} from 'react-icons/fi'
import styles from './DashboardLayout.module.css'
import { ToastProvider } from './ToastProvider'

const navItems = [
  { to: '/', icon: FiHome, label: 'Overview', end: true },
  { to: '/plans', icon: FiPackage, label: 'Plans' },
  { to: '/users', icon: FiUsers, label: 'Users' },
  { to: '/certificates', icon: FiAward, label: 'Certificates' },
  { to: '/certificate-fields', icon: FiTag, label: 'Cert. Fields' },
  { to: '/certificate-types', icon: FiTag, label: 'Certificate Type' },
  { to: '/courses', icon: FiBookOpen, label: 'Courses' },
  { to: '/course-plans', icon: FiPackage, label: 'Course Plans' },
  { to: '/subscriptions', icon: FiCreditCard, label: 'Subscriptions' },
  { to: '/contact', icon: FiMail, label: 'Contact' },
  {
    type: 'dropdown',
    label: 'Page Content',
    icon: FiFileText,
    items: [
      { to: '/about', icon: FiFileText, label: 'About Page' },
      { to: '/page-partners', icon: FiGlobe, label: 'Partners Page' },
      { to: '/page-knowledge-hub', icon: FiBookOpen, label: 'Knowledge Hub' },
      { to: '/page-for-individuals', icon: FiUsers, label: 'For Individuals' },
      { to: '/page-for-employers', icon: FiBriefcase, label: 'For Employers' },
      { to: '/page-contact', icon: FiPhone, label: 'Contact Page' },
      { to: '/page-legal', icon: FiFileText, label: 'Legal Page' },
      { to: '/page-certified-staff', icon: FiUsers, label: 'Certified Staff' },
      { to: '/page-courses', icon: FiBookOpen, label: 'Courses Page' },
      { to: '/site-settings', icon: FiGlobe, label: 'Site Settings' },
      { to: '/list-options', icon: FiList, label: 'List Options' },
    ],
  },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authAPI.getMe()
        if (res.data?.data?.role !== 'admin') {
          navigate('/login')
          return
        }
        setAdmin(res.data.data)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // ignore
    }
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className={styles.layout}>
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className="text-xl font-bold text-primary">
            C<span className="text-primary-light">H</span>
            <span className="text-sm font-normal text-gray-500 ml-2">Admin</span>
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item, idx) => {
            if (item.type === 'dropdown') {
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {dropdownOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                  </button>
                  {dropdownOpen && (
                    <div className="pl-11 pr-4 py-2 space-y-1">
                      {item.items.map((subItem) => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          end={subItem.end}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `block px-3 py-2 text-sm rounded-lg transition-colors ${
                              isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                            }`
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary text-sm font-bold">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {admin?.name || 'Admin'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
      </div>
    </ToastProvider>
  )
}
