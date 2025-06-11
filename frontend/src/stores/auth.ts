// stores/auth.ts
import { defineStore } from 'pinia'
// import axios from 'axios' // We'll use the api instance for login/refresh
import api from '@/api/axios-instance' // Import your configured axios instance
import { config } from '@/config'
import Swal from 'sweetalert2';

interface User {
  id: number
  email: string
  role: string
  name: string
  department?: { // Optional department object for Officers
    id: number;
    name: string;
  } | null; // Can be null if not an officer or not assigned
  is_officer_confirmed: boolean;
  avatar_url?: string; // Optional avatar URL
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null, // Initialize from localStorage
    refreshToken: localStorage.getItem('refreshToken') || null, // Initialize from localStorage
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null, // Initialize from localStorage
  }),
  // Note: department_id is removed from state as we store the full department objec
  getters: {
    // 🟢 isAuthenticated getter
    isAuthenticated: (state) => !!state.accessToken && !!state.user?.id,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isOfficer: (state) => state.user?.role === 'OFFICER',
    isUser: (state) => state.user?.role === 'USER',
    isConfirmedOfficer: (state) => state.user?.role === 'OFFICER' && state.user?.is_officer_confirmed === true, // <--- อาจจะเพิ่ม getter นี้เพื่อความสะดวก
  },
  actions: {
    // 🟢 Action to initialize auth state from localStorage
    initializeAuthFromStorage() {
      this.accessToken = localStorage.getItem('accessToken') || null;
      this.refreshToken = localStorage.getItem('refreshToken') || null;
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
      // If token exists, set it in api instance default headers (if not already handled by request interceptor)
      if (this.accessToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      }
    },
    async login(email: string, password: string) {
      try {
        const res = await api.post(`/auth/login`, { email, password }); // 👈 Use api instance
        this.accessToken = res.data.accessToken;
        this.refreshToken = res.data.refreshToken;
        this.user = res.data.user;
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(this.user)); // 🟢 Store user object
        api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`; // 🟢 Set default header
        return this.user;
      } catch (error: any) {
        console.error('Login failed:', error);
        console.error('Login failed:', error);
        if (error.response) {
          const status = error.response.status;
          const backendErrorMessage = error.response.data?.error;

          if (status === 401) {
            // Handle 401 Unauthorized (e.g., invalid credentials)
            Swal.fire({
              icon: 'error',
              title: 'เข้าสู่ระบบล้มเหลว',
              text: backendErrorMessage || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
            });
          } else if (status === 403) {
            // Handle 403 Forbidden (e.g., unconfirmed officer, banned, etc.)
            Swal.fire({
              icon: 'warning',
              title: 'เข้าสู่ระบบล้มเหลว', // Or 'การเข้าถึงถูกปฏิเสธ'
              text: backendErrorMessage || 'คุณไม่มีสิทธิ์เข้าถึงหรือบัญชีอาจมีปัญหา',
            });
          } else {
            // Handle other HTTP errors from the backend
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: backendErrorMessage || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (Status: ${status})`,
            });
          }
        } else {
          // Handle network errors or other errors where error.response is not available
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
            text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อของคุณ',
          });
        }
        // Consider re-throwing the error or returning a specific value if the calling component needs to react.
      }
    },
    async refreshAccessToken() {
      try {
        if (!this.refreshToken) {
          console.warn('No refresh token available for refreshing access token.');
          this.logout(); // Logout if no refresh token
          throw new Error('No refresh token');
        }
        const res = await api.post(`/auth/refresh`, { // 👈 Use api instance
          token: this.refreshToken,
        })
        const newToken = res.data.accessToken;
        const newUser = res.data.user;

        this.accessToken = newToken;
        this.user = newUser; // Update user object from refresh response
        localStorage.setItem('accessToken', newToken); // Always update accessToken
        localStorage.setItem('user', JSON.stringify(this.user)); // 🟢 Update user in localStorage
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // 🟢 Update default header
        if (res.data.refreshToken) { // Update refreshToken only if backend sends a new one
           this.refreshToken = res.data.refreshToken;
           localStorage.setItem('refreshToken', this.refreshToken);
        }
        
        return newToken
      } catch (err) {
        console.error('Refresh failed:', err)
        if (err.response && err.response.status === 403) {
          Swal.fire({
             icon: 'warning',
             title: 'เซสชันหมดอายุ', // หรือข้อความอื่นที่เหมาะสม
             text: err.response.data.error || 'บัญชี Officer ยังไม่ได้รับการยืนยัน',
           });
        }
        this.logout()
        throw err
      }
    },

    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user'); // 🟢 Remove user from localStorage
      localStorage.removeItem('auth');
      delete api.defaults.headers.common['Authorization']; // 🟢 Remove default header
    },
  },
  persist: true,
})
