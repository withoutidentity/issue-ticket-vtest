<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-black text-white">
    <h1 class="text-4xl font-bold">403</h1>
    <p class="text-lg mt-2">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
    <router-link
      :to="targetRoute"
      class="mt-4 text-blue-400 underline">
      {{ linkText }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const auth = useAuthStore()
// ใช้ computed เพื่อให้ reactive ถ้าค่าใน store เปลี่ยน
const userRole = computed(() => auth.user?.role)

// Computed property สำหรับตัดสินใจว่าจะลิงก์ไปที่ไหน
const targetRoute = computed(() => {
  // อ้างอิงจากหน้า Login: ADMIN และ OFFICER ไป /admin
  if (userRole.value === 'ADMIN' || userRole.value === 'OFFICER') {
    return '/admin'
  }
  // USER กลับไป /home
  else if (userRole.value === 'USER'){
    return '/home'
  }
  // โรลอื่นๆกลับหน้าล็อกอิน
  return '/'
})

// Computed property สำหรับข้อความบนลิงก์
const linkText = computed(() => {
  if (userRole.value === 'ADMIN' || userRole.value === 'OFFICER') {
    // อาจจะใช้คำว่า 'กลับหน้าผู้ดูแล' ถ้า OFFICER ก็ใช้หน้านี้
    return 'กลับหน้าแอดมิน'
  }
  else if (userRole.value === 'USER'){
    return 'กลับหน้าหลัก'
  }
  return 'กลับหน้าล็อกอิน'
})
</script>
