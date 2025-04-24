// stores/auth.ts
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    role: null,
    name: '',
  }),
  actions: {
    async login(email, password) {
      const res = await axios.post('/api/auth/login', { email, password })
      this.token = res.data.accessToken
      this.role = parseJwt(res.data.accessToken).role
      localStorage.setItem('token', this.token)
    },
    logout() {
      this.token = ''
      this.role = ''
      this.name = ''
      localStorage.removeItem('token')
    }
  }
})

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

