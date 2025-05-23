<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black py-12">
    <div class="bg-white flex flex-col items-center justify-center p-8 rounded-xl shadow-lg w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6">ตั้งรหัสผ่านใหม่</h1>
      <form v-if="token" @submit.prevent="onResetPassword" class="space-y-4 w-full">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="กรอกรหัสผ่านใหม่"
            class="w-full p-2 border rounded mt-1"
            :class="{'border-red-500': passwordError}"
            required
          />
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
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
        </div>
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
          <input
            v-model="confirmPassword"
            type="password"
            id="confirmPassword"
            placeholder="ยืนยันรหัสผ่านใหม่"
            class="w-full p-2 border rounded mt-1"
            :class="{'border-red-500': confirmPasswordError}"
            required
          />
          <p v-if="confirmPasswordError" class="text-red-500 text-sm mt-1">{{ confirmPasswordError }}</p>
        </div>
        <button type="submit" class="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          รีเซ็ตรหัสผ่าน
        </button>
      </form>
      <div v-else class="text-center">
        <p class="text-red-500">ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน หรือ Token ไม่ถูกต้อง</p>
        <router-link to="/login" class="mt-4 inline-block text-sm text-blue-600 hover:underline">
          กลับไปหน้าเข้าสู่ระบบ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { config } from '@/config';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

const token = ref<string | null>(null);
const password = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

const minPasswordLength = 8;
const isPasswordLengthValid = computed(() => password.value.length >= minPasswordLength);
const hasUppercase = computed(() => /[A-Z]/.test(password.value));
const hasLowercase = computed(() => /[a-z]/.test(password.value));
const hasNumber = computed(() => /[0-9]/.test(password.value));
const isPasswordStrongEnough = computed(() =>
  isPasswordLengthValid.value && hasUppercase.value && hasLowercase.value && hasNumber.value
);

onMounted(() => {
  const routeToken = route.query.token;
  if (typeof routeToken === 'string' && routeToken) {
    token.value = routeToken;
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Token ไม่ถูกต้อง',
      text: 'ไม่พบ Token สำหรับการรีเซ็ตรหัสผ่านใน URL',
    }).then(() => {
        router.push('/login');
    });
  }
});

const onResetPassword = async () => {
  passwordError.value = '';
  confirmPasswordError.value = '';

  if (!isPasswordStrongEnough.value) {
    passwordError.value = `รหัสผ่านต้องมีอย่างน้อย ${minPasswordLength} ตัวอักษร, ตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, และตัวเลข`;
    return;
  }
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    return;
  }

  try {
    // สมมติว่า API endpoint ของคุณคือ /api/auth/reset-password
    await axios.post(`${config.apiUrl}/api/auth/reset-password`, {
      token: token.value,
      password: password.value,
    });
    Swal.fire({
      icon: 'success',
      title: 'รีเซ็ตรหัสผ่านสำเร็จ',
      text: 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว',
    }).then(() => {
      router.push('/login');
    });
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'การรีเซ็ตรหัสผ่านล้มเหลว',
      text: error.response?.data?.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง หรือขอลิงก์ใหม่',
    });
  }
};
</script>