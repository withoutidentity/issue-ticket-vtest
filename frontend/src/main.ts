import { config } from './config';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'; 
import { createPinia } from 'pinia'
import axios from 'axios'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import './assets/main.css'
import './assets/base.css'

axios.defaults.baseURL = 'http://localhost:3000/api'
const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia) // 🟢 Use Pinia with the app first

// 🟢 Initialize auth store after Pinia is used and before mounting the app
const authStore = useAuthStore();
authStore.initializeAuthFromStorage();

app.use(router)
app.mount('#app')

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })