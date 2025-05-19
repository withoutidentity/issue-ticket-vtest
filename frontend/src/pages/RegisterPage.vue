<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black py-12">
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
        <div class="space-y-1">
          <label for="role" class="block text-sm font-medium text-gray-700">ประเภทผู้ใช้งาน:</label>
          <select v-model="role" id="role" class="w-full p-2 border rounded" required>
            <option value="USER">ผู้ใช้งานทั่วไป (User)</option>
            <option value="OFFICER">เจ้าหน้าที่ (Officer)</option>
          </select>
        </div>

        <div v-if="role === 'OFFICER'" class="space-y-1">
          <label for="department" class="block text-sm font-medium text-gray-700">แผนก:</label>
          <select v-model="selectedDepartment" id="department" class="w-full p-2 border rounded" required>
            <option disabled value="">กรุณาเลือกแผนก</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
        </div>
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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { config } from '@/config'
import Swal from 'sweetalert2' // Import SweetAlert2

type Role = 'USER' | 'OFFICER';

interface Department {
  id: number;
  name: string;
}

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<Role>('USER')
const departments = ref<Department[]>([])
const selectedDepartment = ref<number | string>('') // string for initial disabled option

const router = useRouter()

const fetchDepartments = async () => {
  try {
    const response = await axios.get(`${config.apiUrl}/api/departments`); // สมมติ API endpoint นี้
    departments.value = response.data.data || response.data; // ปรับตามโครงสร้าง response จริง
  } catch (error) {
    console.error('Failed to fetch departments:', error)
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถโหลดรายชื่อแผนกได้',
    })
  }
}

// Computed property สำหรับตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
// จะเป็น true หาก confirmPassword มีค่า และไม่ตรงกับ password
const passwordsDoNotMatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value
})
const onRegister = async () => {
  // ตรวจสอบก่อนว่ารหัสผ่านตรงกันหรือไม่
  if (passwordsDoNotMatch.value) {
    Swal.fire({
      icon: 'warning',
      title: 'รหัสผ่านไม่ตรงกัน',
      text: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน โปรดตรวจสอบอีกครั้ง',
    })
    return // หยุดการทำงานถ้าไม่ตรง
  }

  // ตรวจสอบเพิ่มเติมว่า password ไม่ใช่ค่าว่าง (เผื่อกรณี required ของ HTML ไม่ทำงาน)
  if (!password.value) {
     alert('กรุณากรอกรหัสผ่าน');
     Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกรหัสผ่าน',
     });
     return;
  }

  if (role.value === 'OFFICER' && !selectedDepartment.value) {
    Swal.fire({
      icon: 'warning',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณาเลือกแผนกสำหรับ Officer',
    })
    return
  }

  const payload: any = {
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
  };

  if (role.value === 'OFFICER') {
    payload.department_id = selectedDepartment.value;
  }

  try {
    await axios.post(`${config.apiUrl}/api/auth/register`, payload)

    if (role.value === 'OFFICER') {
      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียน Officer สำเร็จ!',
        text: 'บัญชีของคุณจะต้องได้รับการอนุมัติจากผู้ดูแลระบบก่อนจึงจะสามารถใช้งานได้',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        router.push('/login')
      })
    } else {
      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'คุณสามารถเข้าสู่ระบบได้เลย',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        router.push('/login')
      })
    }
  } catch (err: any) {
    console.error('Registration failed:', err); // แสดง error ใน console เพื่อ debug
    const errorMessage = err.response?.data?.message || 'การสมัครสมาชิกล้มเหลว โปรดลองอีกครั้ง';
    Swal.fire({
      icon: 'error',
      title: 'ลงทะเบียนล้มเหลว',
      text: errorMessage,
    })
  }
}
fetchDepartments()
</script>

<style scoped>
/* เพิ่ม style เล็กน้อยเพื่อให้ข้อความ error ชัดเจนขึ้น */
.text-sm {
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
}
</style>
