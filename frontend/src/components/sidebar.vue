<template>
    <aside class="w-64 bg-black text-white h-screen p-4">
      <h1 class="text-lg font-bold mb-6">Issue Ticket System</h1>
      <nav class="space-y-4">
        <button class="w-full text-center hover:bg-gray-800 p-2 rounded">New Ticket</button>
        <button class="w-full text-center hover:bg-gray-800 p-2 rounded">Report</button>
        <button class="w-full text-center hover:bg-gray-800 p-2 rounded">Dashboard</button>
        <button class="w-full text-center hover:bg-gray-800 p-2 rounded">Profile</button>
        <button @click="logout" class="w-full text-center hover:bg-gray-800 p-2 rounded">Logout</button>
      </nav>
    </aside>
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
