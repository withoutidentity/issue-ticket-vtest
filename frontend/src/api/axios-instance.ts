import axios from 'axios'
import Swal from 'sweetalert2'

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // เปลี่ยนตาม backend ของคุณ
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

// Interceptor: เพิ่ม Authorization header ให้ทุก request ถ้ามี token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // หรือดึงจาก authStore
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: ดัก response ถ้า token หมดอายุจะ auto-refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalConfig = error.config
    // console.log('refreshSubscribers: ', refreshSubscribers)

    if (error.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true

      if (isRefreshing) {
        // ถ้า refresh token กำลังใช้งาน ให้รอ
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`
            resolve(api(originalConfig))
          })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          console.warn('No refresh token found in localStorage')
          throw new Error('No refresh token')
        }

        const res = await api.post('/auth/refresh', { token: refreshToken })

        const newAccessToken = res.data.accessToken
        localStorage.setItem('accessToken', newAccessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        onRefreshed(newAccessToken) // บอกทุก subscriber ว่า token ใหม่มาแล้ว

        originalConfig.headers['Authorization'] = `Bearer ${newAccessToken}`
        return api(originalConfig)

      } catch (refreshErr) {
        console.error('Refresh token failed:', refreshErr)
        // redirect ไป login ถ้าจำเป็น
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        await Swal.fire({
          icon: 'error',
          title: 'Session expired',
          text: 'Please log in again.',
        })
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
      finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
