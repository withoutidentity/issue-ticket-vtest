<template>
  <AppLayout>
    <card>
      <cardcontent>
        <div class="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-2xl space-y-6">
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 class="text-xl sm:text-2xl font-semibold">👤 ข้อมูลผู้ใช้งาน</h2>
            <div v-if="isEditMode" class="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button
                class="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all text-sm sm:text-base"
                @click="saveProfile">
                <span class="material-symbols-outlined text-base">save</span>
                <span>บันทึกข้อมูล</span>
              </button>
              <button
                class="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-red-600 hover:shadow-md transition-all text-sm sm:text-base"
                @click="cancelEdit">
                <span class="material-symbols-outlined text-base">close</span>
                <span>ยกเลิก</span>
              </button>
            </div>
            <button v-else
              class="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all self-start sm:self-center text-sm sm:text-base"
              @click="enterEditMode">
              <span class="material-symbols-outlined text-base">edit</span>
              <span>เเก้ไขโปรไฟล์</span>
            </button>
          </div>
          <!-- Profile Image -->
          <div class="flex flex-col items-center space-y-2">
            <label class="relative group w-24 h-24 sm:w-28 sm:h-28 cursor-pointer">
              <img :src="imagePreview || defaultAvatar"
                class="w-full h-full rounded-full object-cover border-2 border-gray-300" />
              <!-- Overlay แบบกล้องมุมล่างขวา -->
              <div v-if="isEditMode"
                class="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <input v-if="isEditMode" type="file" ref="fileInput" class="hidden" @change="onFileChange" accept="image/png, image/jpeg, image/jpg" />
            </label>
          </div>
          <!-- User Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p class="text-gray-500">ชื่อ-นามสกุล</p>
              <template v-if="isEditMode">
                <input v-model="editableProfile.name" type="text" class="border p-2 rounded w-full" />
              </template>
              <template v-else>
                <p class="font-medium text-lg">{{ originalProfile.name }}</p>
              </template>
            </div>

            <div>
              <p class="text-gray-500">อีเมล</p>
              <template v-if="isEditMode">
                <input v-model="editableProfile.email" type="email" class="border p-2 rounded w-full" />
              </template>
              <template v-else>
                <p class="font-medium text-lg">{{ originalProfile.email }}</p>
              </template>
            </div>
            <div>
              <p class="text-gray-500">ตำแหน่ง</p>
              <!-- Role is read-only -->
              <p class="font-medium text-lg">{{ originalProfile.role }}</p>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex justify-center sm:justify-end pt-4 border-t border-gray-700/25">
            <button
              class="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm bg-yellow-100 text-yellow-800 px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-yellow-200 transition-all"
              @click="onChangePassword">
              <span class="material-symbols-outlined text-sm sm:text-base">lock_reset</span>
              <span>เปลี่ยนรหัสผ่าน</span>
            </button>
          </div>
        </div>
      </cardcontent>
    </card>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';

import Swal from 'sweetalert2'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'; // Import auth store
import api from '@/api/axios-instance'; // Import the pre-configured axios instance
import { config } from '@/config'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore(); // Use auth store


interface User { id: number; name: string; email: string; role: 'USER' | 'OFFICER' | 'ADMIN' | 'BANNED' | ''; }
interface OriginalUserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null; // Added avatar_url
}

const originalProfile = ref<OriginalUserProfile>({
  id: 0, // Add id
  name: '',
  email: '',
  role: '',
  avatar_url: null, // Initialize avatar_url
})

const editableProfile = ref({
  name: '',
  email: '',
});

const isEditMode = ref(false)

// Helper function to construct full avatar URL
const getFullAvatarUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return defaultAvatar;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  // Ensure config.apiUrl is defined and handle potential undefined
  const baseUrl = config.apiUrl ? String(config.apiUrl).replace('/api', '') : '';
  return `${baseUrl}${pathOrUrl}`;
};

onMounted(() => {
  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/me`); // Fetch logged-in user's data
      const userData = response.data;
      originalProfile.value = { ...userData }; // Update local originalProfile
      imagePreview.value = getFullAvatarUrl(userData.avatar_url); // Update local image preview

      // Crucial: Update the auth store with the fetched data
      if (auth.user) {
        auth.user.name = userData.name;
        auth.user.email = userData.email;
        auth.user.avatar_url = userData.avatar_url; // This ensures topbar gets the update
        // auth.user.role = userData.role; // Optionally update role if needed globally
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
      });
    }
  }
  // Initialize profile data from auth store if available, then fetch
  if (auth.user) {
    originalProfile.value = { ...auth.user, id: auth.user.id || 0, avatar_url: auth.user.avatar_url || null }; // Ensure id is number and include avatar_url
    imagePreview.value = getFullAvatarUrl(auth.user.avatar_url); // Use helper for consistency
  }
  fetchUser();
})

// Profile Image (Keep existing logic for image preview, but actual upload/save is not implemented here)
const defaultAvatar = 'https://www.gravatar.com/avatar/?d=mp&f=y'
const imagePreview = ref<string | null>(defaultAvatar) // Initialize with default, type string for URL
const fileInput = ref<HTMLInputElement | null>(null)


const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Show preview immediately
    const reader = new FileReader()
    reader.onload = () => {
      imagePreview.value = reader.result as string;
    }
    reader.readAsDataURL(file)

    // Upload the file
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.put('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const updatedUser = response.data.user;
      originalProfile.value.avatar_url = updatedUser.avatar_url; // Update original profile
      if (auth.user) { // Update auth store
        auth.user.avatar_url = updatedUser.avatar_url;
      }
      // Update preview with server-provided URL
      imagePreview.value = getFullAvatarUrl(updatedUser.avatar_url); // Use helper

      Swal.fire('สำเร็จ', 'เปลี่ยนรูปโปรไฟล์เเล้ว', 'success');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Swal.fire('เกิดข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้', 'error');
      // Reset file input to allow re-selection of the same file if needed
      if (fileInput.value) fileInput.value.value = '';
      // Optionally revert imagePreview to originalProfile.avatar_url or defaultAvatar
      imagePreview.value = getFullAvatarUrl(originalProfile.value.avatar_url); // Revert using helper

    }
  }
}

// ฟังก์ชันโหมดแก้ไข
const enterEditMode = () => {
  editableProfile.value = { // Copy original data to editable form
    name: originalProfile.value.name,
    email: originalProfile.value.email,
  };
  isEditMode.value = true;
}

const saveProfile = async () => {
  try {
    const response = await api.put('/users/me', {
      name: editableProfile.value.name,
      email: editableProfile.value.email,
    });

    // Update original profile and auth store with new data
    originalProfile.value = { ...originalProfile.value, ...response.data.user };
    if (auth.user) {
      auth.user.name = originalProfile.value.name;
      auth.user.email = originalProfile.value.email;
      // Avatar is updated separately by onFileChange and its success updates auth.user.avatar_url
      // Note: Role is not updated here as per requirement
    }

    isEditMode.value = false;
    Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ',
      text: 'ข้อมูลของคุณได้รับการบันทึกเเล้ว',
      timer: 2000,
      showCancelButton: false,
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้',
    });
  }
}

const cancelEdit = async () => {
  const result = await Swal.fire({
    title: 'คุณเเน่ใจหรือไม่?',
    text: 'คุณต้องการยกเลิกการเเก้ไขข้อมูลหรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ยกเลิก',
    cancelButtonText: 'ไม่',
  })

  if (result.isConfirmed) {
    // Reset editable fields (not strictly necessary as we exit edit mode, but good practice)
    editableProfile.value = { name: originalProfile.value.name, email: originalProfile.value.email };
    isEditMode.value = false
   // Reset image preview to the one stored in originalProfile
    imagePreview.value = getFullAvatarUrl(originalProfile.value.avatar_url); // Use helper



    Swal.fire({
      title: 'ยกเลิกการเเก้ไขเเล้ว',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  }
}

// Change Password (Redirects to forgot password page)
const onChangePassword = () => {
  router.push('/change-password')
}

</script>