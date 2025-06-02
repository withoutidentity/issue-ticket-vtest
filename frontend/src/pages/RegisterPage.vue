<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black py-12">
    <div class="bg-white flex flex-col items-center justify-center p-8 rounded-xl shadow-lg">
      <h1 class="text-2xl font-bold">ลงทะเบียนผู้ใช้ใหม่</h1>
      <h2 class="text-xl mb-10">Issue Ticket System</h2>
      <form @submit.prevent="onRegister" class="space-y-4 w-80">
        <div>
          <input v-model="name" type="text" placeholder="username" class="w-full p-2 border rounded" required />
        </div>
        <div>
          <input v-model="email" @blur="validateEmailOnBlur" type="email" placeholder="Email" class="w-full p-2 border rounded" :class="{'border-red-500': emailError}" required />
          <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
        </div>
        <div>
          <input v-model="password" type="password" placeholder="Password" class="w-full p-2 border rounded" :class="{'border-red-500': passwordErrorOnSubmit && !isPasswordStrongEnough}" required />
          <div v-if="password.length > 0" class="text-xs space-y-0.5 mt-1 px-1">
            <p :class="isPasswordLengthValid ? 'text-green-600' : 'text-red-600'">
              <span v-if="isPasswordLengthValid">✓</span><span v-else>✗</span> อย่างน้อย {{minPasswordLength}} ตัวอักษร
            </p>
            <p :class="hasUppercase ? 'text-green-600' : 'text-red-600'">
              <span v-if="hasUppercase">✓</span><span v-else>✗</span> มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)
            </p>
            <p :class="hasLowercase ? 'text-green-600' : 'text-red-600'">
              <span v-if="hasLowercase">✓</span><span v-else>✗</span> มีตัวพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)
            </p>
            <p :class="hasNumber ? 'text-green-600' : 'text-red-600'">
              <span v-if="hasNumber">✓</span><span v-else>✗</span> มีตัวเลขอย่างน้อย 1 ตัว (0-9)
            </p>
          </div>
           <p v-if="passwordErrorOnSubmit" class="text-red-500 text-sm mt-1">{{ passwordErrorOnSubmit }}</p>
        </div>
        <div>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            class="w-full p-2 border rounded"
            :class="{ 'border-red-500': passwordsDoNotMatch && confirmPassword.length > 0 }"
            required
          />
          <p v-if="passwordsDoNotMatch && confirmPassword.length > 0" class="text-red-500 text-sm mt-1">รหัสผ่านไม่ตรงกัน</p>
        </div>
        <!-- <div class="space-y-1">
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
        </div> -->
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

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  department_id?: number | string;
}

const minPasswordLength = 8;

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<Role>('USER')
const departments = ref<Department[]>([])
const selectedDepartment = ref<number | string>('') // string for initial disabled option
const emailError = ref('');
const passwordErrorOnSubmit = ref('');

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

const isValidEmailFormat = (emailToValidate: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailToValidate);
};

const validateEmailOnBlur = () => {
  if (email.value && !isValidEmailFormat(email.value)) {
    emailError.value = 'รูปแบบอีเมลไม่ถูกต้อง';
  } else {
    emailError.value = '';
  }
};

const isPasswordLengthValid = computed(() => password.value.length >= minPasswordLength);
const hasUppercase = computed(() => /[A-Z]/.test(password.value));
const hasLowercase = computed(() => /[a-z]/.test(password.value));
const hasNumber = computed(() => /[0-9]/.test(password.value));

const isPasswordStrongEnough = computed(() =>
  isPasswordLengthValid.value &&
  hasUppercase.value &&
  hasLowercase.value &&
  hasNumber.value
);

const passwordsDoNotMatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value
});

const onRegister = async () => {
  // Reset errors
  emailError.value = '';
  passwordErrorOnSubmit.value = '';

  // 1. Validate Email
  if (!email.value || !isValidEmailFormat(email.value)) {
    emailError.value = 'รูปแบบอีเมลไม่ถูกต้อง';
    Swal.fire({
      icon: 'warning',
      title: 'ข้อมูลไม่ถูกต้อง',
      text: 'กรุณากรอกอีเมลให้ถูกต้อง',
    });
    return;
  }

  // 2. Validate Password Strength (also covers empty password if minPasswordLength > 0)
  if (!isPasswordStrongEnough.value) {
    let errorMessagesList = [];
    if (!password.value) {
        errorMessagesList.push('กรุณากรอกรหัสผ่าน');
    } else {
        if (!isPasswordLengthValid.value) errorMessagesList.push(`ต้องมีความยาวอย่างน้อย ${minPasswordLength} ตัวอักษร`);
        if (!hasUppercase.value) errorMessagesList.push('ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)');
        if (!hasLowercase.value) errorMessagesList.push('ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)');
        if (!hasNumber.value) errorMessagesList.push('ต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)');
    }

    passwordErrorOnSubmit.value = 'รหัสผ่านไม่ตรงตามเงื่อนไข';
    Swal.fire({
      icon: 'warning',
      title: password.value ? 'รหัสผ่านไม่ปลอดภัย' : 'ข้อมูลไม่ครบถ้วน',
      html: `${password.value ? 'กรุณาตั้งรหัสผ่านให้ตรงตามเงื่อนไข:' : ''}<ul class="text-left list-disc list-inside mt-2">${errorMessagesList.map(e => `<li>${e}</li>`).join('')}</ul>`,
    });
    return;
  }

  // 3. Check if passwords match
  if (passwordsDoNotMatch.value) {
    Swal.fire({
      icon: 'warning',
      title: 'รหัสผ่านไม่ตรงกัน',
      text: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน โปรดตรวจสอบอีกครั้ง',
    });
    return;
  }

  // 4. Check department if role is OFFICER
  if (role.value === 'OFFICER' && !selectedDepartment.value) {
    Swal.fire({
      icon: 'warning',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณาเลือกแผนกสำหรับ Officer',
    })
    return
  }

  const payload: RegisterPayload = {
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

onMounted(() => {
  fetchDepartments();
});
</script>

<style scoped>
/* เพิ่ม style เล็กน้อยเพื่อให้ข้อความ error ชัดเจนขึ้น */
.text-sm {
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
}
</style>
