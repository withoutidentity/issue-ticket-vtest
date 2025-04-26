<template>
    <AppLayout>
      <h1 class="text-3xl font-bold">ยินดีต้อนรับ, {{ auth.user.name }}</h1>
      <p class="mt-4">บทบาทของคุณคือ: <strong>{{ auth.user.role }}</strong></p>
    </AppLayout>
  </template>
  
  <script setup lang="ts">
  import AppLayout from '@/layouts/AppLayout.vue'
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore()
  console.log("name:", auth.user.name)
  </script>
  