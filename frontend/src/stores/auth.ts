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
  actions: {
    async login(email: string, password: string) {
      const res = await axios.post(`${config.apiUrl}/api/auth/login`, { email, password })
      this.accessToken = res.data.accessToken
      const payload = parseJwt(this.accessToken)
      this.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      }
      localStorage.setItem('accessToken', this.accessToken)

      const userRes = await axios.get(`${config.apiUrl}/api/protected`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return this.user
    },

    logout() {
      this.accessToken = ''
      this.user = { id: null, email: '', role: '', name: '' }
      localStorage.removeItem('accessToken')
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
