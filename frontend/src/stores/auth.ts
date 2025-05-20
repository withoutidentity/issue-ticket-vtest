// stores/auth.ts
import { defineStore } from 'pinia'
import axios from 'axios'
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
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '',
    user: { id: null, email: '', role: '', name: '', department: null, is_officer_confirmed: false},
  }),
  // Note: department_id is removed from state as we store the full department objec
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isOfficer: (state) => state.user?.role === 'OFFICER',
    isUser: (state) => state.user?.role === 'USER',
    isConfirmedOfficer: (state) => state.user?.role === 'OFFICER' && state.user?.is_officer_confirmed === true, // <--- อาจจะเพิ่ม getter นี้เพื่อความสะดวก
  },
  actions: {
    async login(email: string, password: string) {
      try {
        const res = await axios.post(`${config.apiUrl}/api/auth/login`, { email, password });
        this.accessToken = res.data.accessToken;
        this.refreshToken = res.data.refreshToken;
        this.user = res.data.user;
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        console.log('user login: ', this.user)
        return this.user;
      } catch (error: any) {
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
        const res = await axios.post(`${config.apiUrl}/api/auth/refresh`, {
          token: this.refreshToken,
        })
        const newToken = res.data.accessToken;
        const newUser = res.data.user;
        console.log('new user refresh : ', newUser) //ใช้เสร็จลบด้วย
        this.accessToken = newToken;
        this.user = newUser; // Update user object from refresh response
        localStorage.setItem('accessToken', newToken); // Always update accessToken

        this.user = newUser // Update user object from refresh response
        localStorage.setItem('accessToken', newToken) // Always update accessToken
        if (res.data.refreshToken) { // Update refreshToken only if backend sends a new one
           this.refreshToken = res.data.refreshToken;
           localStorage.setItem('refreshToken', this.refreshToken);
        }

        console.log('Refreshed token:', newToken)
        console.log('local token: ',localStorage.getItem('accessToken'))
        
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
      this.accessToken = ''
      this.user = { id: null, email: '', role: '', name: '', department: null }
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
  },
  persist: true,
})

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}
