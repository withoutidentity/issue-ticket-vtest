import { config } from './config';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './assets/main.css'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:3000/api'
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })