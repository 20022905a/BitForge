import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Automatically attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If token expired, clear it
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bt_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
