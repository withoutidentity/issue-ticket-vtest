<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black">
    <div class="bg-white flex flex-col items-center justify-center p-8 rounded-xl shadow-lg">
      <h1 class="text-2xl font-bold">ลงทะเบียนผู้ใช้ใหม่</h1>
      <h2 class="text-xl mb-10">Issue Ticket System</h2>
      <form @submit.prevent="onRegister" class="space-y-4 w-80">
        <input v-model="name" type="text" placeholder="ชื่อ-นามสกุล" class="w-full p-2 border rounded" required />
        <input v-model="email" type="email" placeholder="Email" class="w-full p-2 border rounded" required />
        <input v-model="password" type="password" placeholder="Password" class="w-full p-2 border rounded" required />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          class="w-full p-2 border rounded"
          :class="{ 'border-red-500': passwordsDoNotMatch }"
          required
        />
        <!-- แสดงข้อความแจ้งเตือนเมื่อรหัสผ่านไม่ตรงกัน และ confirmPassword มีการป้อนข้อมูลแล้ว -->
        <p v-if="passwordsDoNotMatch" class="text-red-500 text-sm">รหัสผ่านไม่ตรงกัน</p>
        <button type="submit" class="w-full bg-black text-white py-2 rounded hover:bg-gray-800">สมัครสมาชิก</button>
      </form>
      <router-link to="/login" class="mt-4 text-lg text-gray-600 hover:text-gray-800">
        มีบัญชีอยู่แล้ว? <span class="text-blue-600 hover:underline">เข้าสู่ระบบ</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue' // เพิ่ม computed
import axios from 'axios'
import { useRouter } from 'vue-router'
import { config } from '@/config'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()

// Computed property สำหรับตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
// จะเป็น true หาก confirmPassword มีค่า และไม่ตรงกับ password
const passwordsDoNotMatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value
})

const onRegister = async () => {
  // ตรวจสอบก่อนว่ารหัสผ่านตรงกันหรือไม่
  if (passwordsDoNotMatch.value) {
    alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน โปรดตรวจสอบอีกครั้ง')
    return // หยุดการทำงานถ้าไม่ตรง
  }

  // ตรวจสอบเพิ่มเติมว่า password ไม่ใช่ค่าว่าง (เผื่อกรณี required ของ HTML ไม่ทำงาน)
  if (!password.value) {
     alert('กรุณากรอกรหัสผ่าน');
     return;
  }


  try {
    // ส่งเฉพาะ name, email, password ไปยัง API
    await axios.post(`${config.apiUrl}/api/auth/register`, {
      name: name.value,
      email: email.value,
      password: password.value // ส่งเฉพาะ password ไม่ต้องส่ง confirmPassword
    })
    alert('สมัครสมาชิกเรียบร้อย! คุณสามารถเข้าสู่ระบบได้เลย')
    router.push('/login')
  } catch (err: any) { // เพิ่ม type annotation ให้ err
    console.error('Registration failed:', err); // แสดง error ใน console เพื่อ debug
    // ลองแสดงข้อความจาก error response ถ้ามี
    const errorMessage = err.response?.data?.message || 'การสมัครสมาชิกล้มเหลว โปรดลองอีกครั้ง';
    alert(errorMessage);
  }
}
</script>

<style scoped>
/* เพิ่ม style เล็กน้อยเพื่อให้ข้อความ error ชัดเจนขึ้น */
.text-sm {
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
}
</style>
