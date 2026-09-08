import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCookie(name) {
  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split('=')[1]) : null;
}

function getCsrfToken() {
  return getCookie('csrfToken') || sessionStorage.getItem('csrfToken');
}

api.interceptors.request.use((config) => {
  config.headers['X-Auth-Scope'] = 'admin';
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD'].includes(method)) {
    config.headers['X-CSRF-Token'] = getCsrfToken() || '';
  }
  // For FormData, remove Content-Type to let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.data?.csrfToken) {
    sessionStorage.setItem('csrfToken', response.data.csrfToken);
  }
  return response;
}, async (error) => {
  const originalRequest = error.config;
  const isCsrfError =
    error.response?.status === 403 &&
    error.response?.data?.code === 'CSRF_INVALID';

  if (!isCsrfError || !originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    const refreshResponse = await api.get('/auth/me');
    if (refreshResponse.data?.csrfToken) {
      sessionStorage.setItem('csrfToken', refreshResponse.data.csrfToken);
    }

    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers['X-CSRF-Token'] = getCsrfToken() || '';

    return api(originalRequest);
  } catch (refreshError) {
    return Promise.reject(refreshError);
  }
});

// Auth
export const authAPI = {
  login: async (data) => {
    const res = await api.post('/auth/login', { ...data, role: 'admin' });
    if (res.data?.csrfToken) {
      sessionStorage.setItem('csrfToken', res.data.csrfToken);
    }
    return res;
  },
  logout: async () => {
    try {
      return await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('csrfToken');
    }
  },
  getMe: () => api.get('/auth/me'),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getCompanies: (params) => api.get('/admin/companies', { params }),
  setUserSuspended: (id, suspended) => api.patch(`/admin/users/${id}/suspend`, { suspended }),
  setCompanySuspended: (id, suspended) => api.patch(`/admin/companies/${id}/suspend`, { suspended }),
  getCertificates: (params) => api.get('/admin/certificates', { params }),
  verifyCertificate: (id, data) => api.put(`/admin/certificates/${id}/verify`, data),
  toggleCertificateActive: (id, data) => api.put(`/admin/certificates/${id}/active`, data),
  deleteCertificate: (id, permanent) => api.delete(`/admin/certificates/${id}${permanent ? '?permanent=true' : ''}`),
  restoreCertificate: (id) => api.patch(`/admin/certificates/${id}/restore`),
  getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
  updateSubscriptionStatus: (id, data) => api.put(`/admin/subscriptions/${id}/status`, data),
  extendSubscription: (id, data) => api.put(`/admin/subscriptions/${id}/extend`, data),
  changeSubscriptionPlan: (id, data) => api.put(`/admin/subscriptions/${id}/change-plan`, data),
  resetSubscriptionUsage: (id) => api.put(`/admin/subscriptions/${id}/reset-usage`),
  createPlan: (data) => api.post('/admin/plans', data),
  updatePlan: (id, data) => api.put(`/admin/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/admin/plans/${id}`),
  // Certificate Types
  getCertificateTypes: (params) => api.get('/admin/certificate-types', { params }),
  createCertificateType: (data) => api.post('/admin/certificate-types', data),
  updateCertificateType: (id, data) => api.put(`/admin/certificate-types/${id}`, data),
  deleteCertificateType: (id) => api.delete(`/admin/certificate-types/${id}`),
  // Certificate Fields
  getCertificateFields: () => api.get('/admin/certificate-fields'),
  createCertificateField: (data) => api.post('/admin/certificate-fields', data),
  updateCertificateField: (id, data) => api.put(`/admin/certificate-fields/${id}`, data),
  deleteCertificateField: (id) => api.delete(`/admin/certificate-fields/${id}`),
  // Contact Messages
  getContactMessages: (params) => api.get('/contact', { params }),
  updateContactMessageStatus: (id, data) => api.put(`/contact/${id}/status`, data),
  deleteContactMessage: (id) => api.delete(`/contact/${id}`),
};

// Plans (public — dashboard needs all plans including trials)
export const plansAPI = {
  getAll: () => api.get('/admin/plans'),
};

// Courses
export const coursesAPI = {
  getAll: (params) => api.get('/admin/courses', { params }),
  create: (data) => api.post('/admin/courses', data),
  update: (id, data) => api.put(`/admin/courses/${id}`, data),
  delete: (id) => api.delete(`/admin/courses/${id}`),
};

// Course Categories
export const courseCategoriesAPI = {
  getAll: () => api.get('/admin/course-categories'),
  create: (data) => api.post('/admin/course-categories', data),
  update: (id, data) => api.put(`/admin/course-categories/${id}`, data),
  delete: (id) => api.delete(`/admin/course-categories/${id}`),
};

// Course Plans
export const coursePlansAPI = {
  getAll: () => api.get('/admin/course-plans'),
  create: (data) => api.post('/admin/course-plans', data),
  update: (id, data) => api.put(`/admin/course-plans/${id}`, data),
  delete: (id) => api.delete(`/admin/course-plans/${id}`),
  getSubscriptions: () => api.get('/admin/course-plan-subscriptions'),
};

// About Page
export const aboutAPI = {
  get: () => api.get('/about'),
  update: (data) => api.put('/about', data),
  uploadHeroMedia: (formData) =>
    api.post('/about/hero-media', formData, {
      timeout: 180000,
    }),
  uploadAboutImage: (formData) =>
    api.post('/about/upload-image', formData),
};

// Page Content (all static pages managed via /pages endpoint)
export const pagesAPI = {
  getHome: () => api.get('/pages/home'),
  updateHome: (data) => api.put('/pages/home', data),
  getPartners: () => api.get('/pages/partners'),
  updatePartners: (data) => api.put('/pages/partners', data),
  getKnowledgeHub: () => api.get('/pages/knowledge-hub'),
  updateKnowledgeHub: (data) => api.put('/pages/knowledge-hub', data),
  getForIndividuals: () => api.get('/pages/for-individuals'),
  updateForIndividuals: (data) => api.put('/pages/for-individuals', data),
  getForEmployers: () => api.get('/pages/for-employers'),
  updateForEmployers: (data) => api.put('/pages/for-employers', data),
  getContact: () => api.get('/pages/contact'),
  updateContact: (data) => api.put('/pages/contact', data),
  getLegal: () => api.get('/pages/legal'),
  updateLegal: (data) => api.put('/pages/legal', data),
  getCertifiedStaff: () => api.get('/pages/certified-staff'),
  updateCertifiedStaff: (data) => api.put('/pages/certified-staff', data),
  getCoursesPage: () => api.get('/pages/courses'),
  updateCoursesPage: (data) => api.put('/pages/courses', data),
  getSiteSettings: () => api.get('/pages/site-settings'),
  updateSiteSettings: (data) => api.put('/pages/site-settings', data),
  getListOptions: (category) => api.get(`/list-options${category ? `?category=${category}` : ''}`),
  getListOption: (id) => api.get(`/list-options/${id}`),
  createListOption: (data) => api.post('/list-options', data),
  updateListOption: (id, data) => api.put(`/list-options/${id}`, data),
  deleteListOption: (id) => api.delete(`/list-options/${id}`),
};

export default api;
