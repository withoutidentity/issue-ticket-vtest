import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'


// ฟังก์ชันเขียน log ลงไฟล์
function writeChangeLog(message) {
  const timestamp = new Date().toISOString()
  fs.appendFileSync('change.log', `[${timestamp}] ${message}\n`)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    {
      name: 'log-file-changes',
      configureServer(server) {
        server.watcher.on('change', (path) => {
          const logMessage = `File changed: ${path}`
          console.log(logMessage) // แสดงใน console
          writeChangeLog(logMessage) // เขียนลงไฟล์
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
