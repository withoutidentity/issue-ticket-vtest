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
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '',
    user: { id: null, email: '', role: '', name: '', department: null},
  }),
  // Note: department_id is removed from state as we store the full department objec
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isOfficer: (state) => state.user?.role === 'OFFICER',
    isUser: (state) => state.user?.role === 'USER',
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
        return this.user;
      } catch (error: any) {
        console.error('Login failed:', error);
        if (error.response && error.response.status === 403) {
          // Handle specific 403 error for unconfirmed officer
          Swal.fire({
            icon: 'warning',
            title: 'เข้าสู่ระบบล้มเหลว',
            text: error.response.data.error || 'บัญชี Officer ยังไม่ได้รับการยืนยัน',
          });
        }
      }
    },
    async refreshAccessToken() {
      try {
        const res = await axios.post(`${config.apiUrl}/api/auth/refresh`, {
          token: this.refreshToken,
        })
        const newToken = res.data.accessToken;
        const newUser = res.data.user;
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
