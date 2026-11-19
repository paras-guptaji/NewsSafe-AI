import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Optional response interceptor to ease error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.detail || error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    }
    return Promise.reject(customError)
  }
)

export const newsAPI = {
  getNews: (params) => api.get('/api/news', { params }),
  refreshNews: (data) => api.post('/api/news/refresh', data),
  getNewsById: (id) => api.get(`/api/news/${id}`),
  analyzeArticle: (id) => api.post(`/api/news/${id}/analyze`),
  getDetailedSummary: (id) => api.post(`/api/news/${id}/detailed-summary`),
}

export const analyzeAPI = {
  analyzeURL: (url) => api.post('/api/analyze-url', { url }),
  analyzeText: (data) => api.post('/api/analyze-text', data),
}

export const bookmarksAPI = {
  getBookmarks: () => api.get('/api/bookmarks'),
  addBookmark: (id) => api.post(`/api/bookmarks/${id}`),
  removeBookmark: (id) => api.delete(`/api/bookmarks/${id}`),
}

export const statsAPI = {
  getStats: () => api.get('/api/stats'),
  getHealth: () => api.get('/api/health'),
  getSettings: () => api.get('/api/settings/status'),
  clearBookmarks: () => api.delete('/api/bookmarks'),
}

export default api
