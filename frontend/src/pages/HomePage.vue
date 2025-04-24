<template>
    <AppLayout>
      <h1 class="text-3xl font-bold">ยินดีต้อนรับ, {{ auth.name }}</h1>
      <p class="mt-4">บทบาทของคุณคือ: <strong>{{ auth.role }}</strong></p>
    </AppLayout>
  </template>
  
  <script setup lang="ts">
  import AppLayout from '@/layouts/AppLayout.vue'
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore()
  </script>
  