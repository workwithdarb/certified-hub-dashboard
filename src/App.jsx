import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'

const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const IndividualsPage = lazy(() => import('./pages/IndividualsPage'))
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'))
const PlansPage = lazy(() => import('./pages/PlansPage'))
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'))
const CertificateTypesPage = lazy(() => import('./pages/CertificateTypesPage'))
const CertificateFieldsPage = lazy(() => import('./pages/CertificateFieldsPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CourseCategoriesPage = lazy(() => import('./pages/CourseCategoriesPage'))
const CoursePlansPage = lazy(() => import('./pages/CoursePlansPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactMessagesPage = lazy(() => import('./pages/ContactMessagesPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const KnowledgeHubPage = lazy(() => import('./pages/KnowledgeHubPage'))
const ForIndividualsPage = lazy(() => import('./pages/ForIndividualsPage'))
const ForEmployersPage = lazy(() => import('./pages/ForEmployersPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const CertifiedStaffPage = lazy(() => import('./pages/CertifiedStaffPage'))
const CoursesContentPage = lazy(() => import('./pages/CoursesContentPage'))
const SiteSettingsPage = lazy(() => import('./pages/SiteSettingsPage'))
const ListOptionsPage = lazy(() => import('./pages/ListOptionsPage'))

function PageLoader() {
  return (
    <div className="min-h-[300px] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<LazyPage><OverviewPage /></LazyPage>} />
        <Route path="users" element={<LazyPage><UsersPage /></LazyPage>} />
        <Route path="individuals" element={<LazyPage><IndividualsPage /></LazyPage>} />
        <Route path="companies" element={<LazyPage><CompaniesPage /></LazyPage>} />
        <Route path="certificates" element={<LazyPage><CertificatesPage /></LazyPage>} />
        <Route path="plans" element={<LazyPage><PlansPage /></LazyPage>} />
        <Route path="subscriptions" element={<LazyPage><SubscriptionsPage /></LazyPage>} />
        <Route path="certificate-types" element={<LazyPage><CertificateTypesPage /></LazyPage>} />
        <Route path="certificate-fields" element={<LazyPage><CertificateFieldsPage /></LazyPage>} />
        <Route path="courses" element={<LazyPage><CoursesPage /></LazyPage>} />
        <Route path="course-categories" element={<LazyPage><CourseCategoriesPage /></LazyPage>} />
        <Route path="course-plans" element={<LazyPage><CoursePlansPage /></LazyPage>} />
        <Route path="about" element={<LazyPage><AboutPage /></LazyPage>} />
        <Route path="contact" element={<LazyPage><ContactMessagesPage /></LazyPage>} />
        <Route path="page-home" element={<LazyPage><HomePage /></LazyPage>} />
        <Route path="page-partners" element={<LazyPage><PartnersPage /></LazyPage>} />
        <Route path="page-knowledge-hub" element={<LazyPage><KnowledgeHubPage /></LazyPage>} />
        <Route path="page-for-individuals" element={<LazyPage><ForIndividualsPage /></LazyPage>} />
        <Route path="page-for-employers" element={<LazyPage><ForEmployersPage /></LazyPage>} />
        <Route path="page-contact" element={<LazyPage><ContactPage /></LazyPage>} />
        <Route path="page-legal" element={<LazyPage><LegalPage /></LazyPage>} />
        <Route path="page-certified-staff" element={<LazyPage><CertifiedStaffPage /></LazyPage>} />
        <Route path="page-courses" element={<LazyPage><CoursesContentPage /></LazyPage>} />
        <Route path="site-settings" element={<LazyPage><SiteSettingsPage /></LazyPage>} />
        <Route path="list-options" element={<LazyPage><ListOptionsPage /></LazyPage>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
