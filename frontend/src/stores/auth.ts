// stores/auth.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { config } from '@/config'

interface User {
  id: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as { id: string; email: string; role: string } | null,
  }),
  actions: {
    async login(email: string, password: string) {
      const res = await axios.post(`${config.apiUrl}/api/auth/login`, { email, password })
      this.token = res.data.accessToken
      this.role = parseJwt(res.data.accessToken).role
      localStorage.setItem('token', this.token)

      const userRes = await axios.get('http://localhost:3000/api/protected', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      this.user = userRes.data.user

      return this.user //return ให้ใช้ได้ต่อ
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

