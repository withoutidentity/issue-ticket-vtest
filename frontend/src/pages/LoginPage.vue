<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black">
    <div class="bg-white flex flex-col items-center justify-center p-8 rounded-xl shadow-lg">
      <h1 class="text-2xl font-bold">ระบบแจ้งปัญหา</h1>
      <h2 class="text-xl mb-10">Issue Ticket System</h2>
      <form @submit.prevent="onLogin" class="space-y-4 w-80">
        <input v-model="email" type="email" placeholder="Email" class="w-full p-2 border rounded" required />
        <input v-model="password" type="password" placeholder="Password" class="w-full p-2 border rounded" required />
        <button type="submit" class="w-full bg-black text-white py-2 rounded hover:bg-gray-800">เข้าสู่ระบบ</button>
      </form>
      <router-link to="/register" class="mt-4 text-lg text-gray-600 hover:text-gray-800">
        ยังไม่มีบัญชี? <span class="text-blue-600 hover:underline">ลงทะเบียน</span>
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

    console.log("role:", auth.user?.role)

    const role = auth.user?.role

    if (role === 'ADMIN' || role === 'OFFICER') {
      router.push('/admin')
    } else {
      router.push('/home')
    }
  } catch (err: any) {
    alert(err?.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ')
    Response.json({ error: 'เข้าสู่ระบบไม่สำเร็จ' })
  }
}
</script>