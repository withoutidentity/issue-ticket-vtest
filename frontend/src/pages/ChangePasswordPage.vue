<template>
    <AppLayout>
        <card>
            <cardcontent>
                <button @click="goBack" type="button"
                    class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>ย้อนกลับ</span>
                </button>
                <div class="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl space-y-6">
                    <h2 class="text-2xl font-semibold text-center">เปลี่ยนรหัสผ่าน</h2>

                    <form @submit.prevent="handleChangePassword" class="space-y-4">
                        <div>
                            <label for="current-password"
                                class="block text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
                            <input id="current-password" v-model="currentPassword" type="password" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div>
                            <label for="new-password"
                                class="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                            <input id="new-password" v-model="newPassword" type="password" required minlength="8"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            <p class="mt-1 text-xs text-gray-500">รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร</p>
                        </div>

                        <div>
                            <label for="confirm-new-password"
                                class="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                            <input id="confirm-new-password" v-model="confirmNewPassword" type="password" required
                                minlength="8"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>

                        <div v-if="passwordMismatch" class="text-red-600 text-sm">
                            รหัสผ่านใหม่และยืนยันรหัสผ่านใหม่ไม่ตรงกัน
                        </div>

                        <button type="submit" :disabled="isLoading || passwordMismatch"
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span v-if="isLoading"
                                class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            {{ isLoading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน' }}
                        </button>
                    </form>
                </div>
            </cardcontent>
        </card>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import Swal from 'sweetalert2';
import api from '@/api/axios-instance';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const isLoading = ref(false);

const goBack = () => {
    router.go(-1) // ย้อนกลับ 1 หน้าในประวัติ
}

const passwordMismatch = computed(() => {
    return newPassword.value !== confirmNewPassword.value && confirmNewPassword.value !== '';
});

const handleChangePassword = async () => {
    if (passwordMismatch.value) {
        Swal.fire('ข้อผิดพลาด', 'รหัสผ่านใหม่และยืนยันรหัสผ่านใหม่ไม่ตรงกัน', 'error');
        return;
    }

    if (newPassword.value.length < 8) {
        Swal.fire('ข้อผิดพลาด', 'รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร', 'error');
        return;
    }

    isLoading.value = true;

    try {
        const response = await api.put('/users/me/password', {
            currentPassword: currentPassword.value,
            newPassword: newPassword.value,
        });

        Swal.fire('สำเร็จ', response.data.message || 'เปลี่ยนรหัสผ่านสำเร็จแล้ว', 'success');
        // Optionally redirect user after successful password change
        router.push('/profile'); // Redirect back to profile page

    } catch (error: any) {
        console.error('Error changing password:', error);
        const errorMessage = error.response?.data?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้';
        Swal.fire('เกิดข้อผิดพลาด', errorMessage, 'error');
    } finally {
        isLoading.value = false;
        // Clear password fields regardless of success/failure for security
        currentPassword.value = '';
        newPassword.value = '';
        confirmNewPassword.value = '';
    }
};
</script>

<style scoped>
/* Add any specific styles here if needed */
</style>