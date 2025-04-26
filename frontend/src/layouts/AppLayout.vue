<template>
    <div class="min-h-screen bg-white text-black">
      <nav class="flex justify-between items-center px-6 py-4 border-b bg-black text-white">
        <div class="text-xl font-bold">🎫 Issue Tracker</div>
        <div class="flex items-center space-x-4">
          <span>{{ auth.user.name }} ({{ auth.user.role }})</span>
          <button @click="logout" class="bg-white text-black px-3 py-1 rounded hover:bg-gray-100">Logout</button>
        </div>
      </nav>
      <main class="p-6">
        <slot />
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAuthStore } from '@/stores/auth'
  import { useRouter } from 'vue-router'
  
  const auth = useAuthStore()
  const router = useRouter()
  
  const logout = () => {
    auth.logout()
    router.push('/')
  }
  </script>
  