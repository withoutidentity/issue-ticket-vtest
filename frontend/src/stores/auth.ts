// stores/auth.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { config } from '@/config'

interface User {
  id: number
  email: string
  role: string
  name: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '',
    user: { id: null, email: '', role: '', name: '' },
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isUser: (state) => state.user?.role === 'USER',
  },
  actions: {
    async login(email: string, password: string) {
      const res = await axios.post(`${config.apiUrl}/api/auth/login`, { email, password })
      this.accessToken = res.data.accessToken
      this.refreshToken = res.data.refreshToken
      this.user = res.data.user
      localStorage.setItem('accessToken', this.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      
      const payload = parseJwt(this.accessToken)
      this.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      }
      // console.log('token', this.accessToken)
      // console.log('local token: ',localStorage.getItem('accessToken'))
      const userRes = await axios.get(`${config.apiUrl}/api/protected`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return this.user
    },
    async refreshAccessToken() {
      try {
        const res = await axios.post(`${config.apiUrl}/api/auth/refresh`, {
          token: this.refreshToken,
        })
        const newToken = res.data.accessToken
        this.setTokens(newToken, this.refreshToken)
        this.accessToken = newToken
        localStorage.setItem('accessToken', newToken)
        console.log('new token: ', newToken)

        // Update user info if needed
        const payload = parseJwt(newToken)
        this.user = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          name: payload.name,
        }

        console.log('Refreshed token:', newToken)
        console.log('local token: ',localStorage.getItem('accessToken'))
        
        return newToken
      } catch (err) {
        console.error('Refresh failed:', err)
        this.logout()
        throw err
      }
    },

    logout() {
      this.accessToken = ''
      this.user = { id: null, email: '', role: '', name: '' }
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
