<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#eeeeee] text-black py-12">
    <div class="bg-white flex flex-col items-center justify-center p-8 rounded-xl shadow-lg w-full max-w-md">
      <h1 class="text-2xl font-bold mb-2">ลืมรหัสผ่าน</h1>
      <p class="text-gray-600 mb-6 text-center">กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน</p>
      <form @submit.prevent="onRequestReset" class="space-y-4 w-full">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">อีเมล</label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="your@email.com"
            class="w-full p-2 border rounded mt-1"
            :class="{'border-red-500': emailError}"
            required
          />
          <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
        </div>
        <button
          type="submit"
          class="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-opacity duration-200"
          :disabled="isButtonDisabled"
          :class="{ 'opacity-50 cursor-not-allowed': isButtonDisabled }"
        >
          {{ buttonText }}
        </button>
      </form>
      <router-link to="/login" class="mt-6 text-sm text-blue-600 hover:underline">
        กลับไปหน้าเข้าสู่ระบบ
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import axios from 'axios';
import { config } from '@/config';
import Swal from 'sweetalert2';

const email = ref('');
const emailError = ref('');
const isSubmitting = ref(false);

type RequestPhase = 'initial' | 'cooldown' | 'can_resend' | 'max_attempts_reached';
const requestPhase = ref<RequestPhase>('initial');

const COOLDOWN_TIME_SECONDS = 60; // 1 นาที
const cooldownSeconds = ref(COOLDOWN_TIME_SECONDS);
let cooldownIntervalId: number | undefined = undefined;

const isValidEmailFormat = (emailToValidate: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailToValidate);
};

const startCooldown = () => {
  requestPhase.value = 'cooldown';
  cooldownSeconds.value = COOLDOWN_TIME_SECONDS;

  if (cooldownIntervalId) {
    clearInterval(cooldownIntervalId);
  }

  cooldownIntervalId = window.setInterval(() => {
    cooldownSeconds.value--;
    if (cooldownSeconds.value <= 0) {
      clearInterval(cooldownIntervalId);
      cooldownIntervalId = undefined;
      // ตรวจสอบให้แน่ใจว่า phase ยังเป็น cooldown ก่อนเปลี่ยนเป็น can_resend
      // เพื่อป้องกันกรณีที่ phase อาจถูกเปลี่ยนโดย logic อื่น (ซึ่งไม่น่าเกิดในเคสนี้)
      if (requestPhase.value === 'cooldown') {
        requestPhase.value = 'can_resend';
      }
    }
  }, 1000);
};

const onRequestReset = async () => {
  emailError.value = '';
  if (!isValidEmailFormat(email.value)) {
    emailError.value = 'รูปแบบอีเมลไม่ถูกต้อง';
    return;
  }

  // ป้องกันการ submit ซ้ำซ้อนถ้าปุ่มยังไม่ถูก disable ทัน
  if (isSubmitting.value || requestPhase.value === 'cooldown' || requestPhase.value === 'max_attempts_reached') {
    return;
  }

  isSubmitting.value = true;

  try {
    await axios.post(`${config.apiUrl}/api/auth/forgot-password`, { email: email.value });

    if (requestPhase.value === 'initial') {
      Swal.fire({
        icon: 'success',
        title: 'ส่งคำขอสำเร็จ',
        text: 'หากอีเมลของคุณมีอยู่ในระบบ คุณจะได้รับอีเมลพร้อมลิงก์สำหรับรีเซ็ตรหัสผ่าน',
      });
      startCooldown(); // จะเปลี่ยน requestPhase เป็น 'cooldown'
    } else if (requestPhase.value === 'can_resend') {
      Swal.fire({
        icon: 'success',
        title: 'ส่งคำขออีกครั้งสำเร็จ',
        text: 'อีเมลรีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณอีกครั้งแล้ว',
      });
      requestPhase.value = 'max_attempts_reached';
      if (cooldownIntervalId) { // หยุด interval ถ้ายังทำงานอยู่ (ไม่ควรเกิด)
        clearInterval(cooldownIntervalId);
        cooldownIntervalId = undefined;
      }
    }
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.response?.data?.message || 'ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง',
    });
    // หาก API ล้มเหลว, requestPhase จะไม่เปลี่ยน ทำให้ผู้ใช้สามารถลองกดปุ่มเดิมได้อีกครั้ง (ถ้ายังไม่ถึง max_attempts)
  } finally {
    isSubmitting.value = false;
  }
};

const buttonText = computed(() => {
  switch (requestPhase.value) {
    case 'initial':
      return 'ส่งคำขอรีเซ็ตรหัสผ่าน';
    case 'cooldown':
      return `ส่งอีกครั้งใน ${cooldownSeconds.value} วินาที`;
    case 'can_resend':
      return 'ส่งคำขออีกครั้ง';
    case 'max_attempts_reached':
      return 'ส่งคำขอสำเร็จแล้ว'; // หรือ "จำกัดการส่งคำขอแล้ว"
    default:
      return 'ส่งคำขอรีเซ็ตรหัสผ่าน'; // ค่า fallback
  }
});

const isButtonDisabled = computed(() => {
  return isSubmitting.value || requestPhase.value === 'cooldown' || requestPhase.value === 'max_attempts_reached';
});

onUnmounted(() => {
  if (cooldownIntervalId) {
    clearInterval(cooldownIntervalId);
  }
});
</script>