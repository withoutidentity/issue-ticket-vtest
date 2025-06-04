<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black px-4 py-8 sm:px-6 lg:px-8">
    <div class="bg-white flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
      <h1 class="text-xl sm:text-2xl font-bold text-center">ระบบแจ้งปัญหา</h1>
      <h2 class="text-lg sm:text-xl mb-6 sm:mb-10 text-center">Issue Ticket System</h2>
      <form @submit.prevent="onLogin" class="space-y-4 w-full">
        <input v-model="email" type="email" placeholder="Email" class="w-full p-2 border rounded" required />
        <input v-model="password" type="password" placeholder="Password" class="w-full p-2 border rounded" required />
        <button type="submit" class="w-full bg-black text-white py-2 rounded hover:bg-gray-800">เข้าสู่ระบบ</button>
      </form>
      <router-link to="/register" class="mt-6 text-base sm:text-lg text-gray-600 hover:text-gray-800">
        ยังไม่มีบัญชี? <span class="text-blue-600 hover:underline">ลงทะเบียน</span>
      </router-link>
      <router-link to="/forgot-password" class="mt-3 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:underline">
        ลืมรหัสผ่าน?
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const auth = useAuthStore()
const router = useRouter()


const onLogin = async () => {
  try {
    await auth.login(email.value, password.value)

    // console.log("role:", auth.user?.role)

    const role = auth.user?.role

    if (role === 'ADMIN' ) {
      router.push('/dashboard')
    } else if (role ==='USER' || role === 'OFFICER') {
      router.push('/home')
    }
  } catch (err: any) {
    alert(err?.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ')
    // Response.json({ error: 'เข้าสู่ระบบไม่สำเร็จ' }) // This line seems incorrect for client-side code and can be removed
  }
}
</script>