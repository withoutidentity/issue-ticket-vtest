<template>
    <AppLayout>
      <h1 class="text-3xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
      <p class="mt-4">ยินดีต้อนรับคุณ {{ auth.user }}</p>
    </AppLayout>
  </template>
  
  <script setup lang="ts">
  import AppLayout from '@/layouts/AppLayout.vue'
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore()
  </script>
  