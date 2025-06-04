<template>
    <!-- Changed from fixed to sticky, removed left-0 right-0 -->
    <header :class="headerClass" class="px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
        <!-- Burger button for mobile -->
        <button @click="$emit('toggle-sidebar-mobile')" class="md:hidden text-gray-600 hover:text-gray-800 focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
        </button>

        <!-- Existing topbar content, ensure it's on the right or centered as needed -->
        <div class="flex items-center space-x-2 ml-auto"> <!-- ml-auto pushes to the right if burger is present -->
            <Notification />
            <img
              :src="avatarUrl"
              alt="User Avatar"
              class="w-8 h-8 rounded-full object-cover border border-gray-300"
            />
            <span>{{ auth.user?.name || 'User' }}</span> <!-- เพิ่ม optional chaining และ fallback name -->
        </div>
    </header>
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref, computed, onMounted, onUnmounted, getCurrentInstance, watch } from 'vue'
import Notification from '@/components/Notification.vue'
import { config } from '@/config'; // Import config for API base URL

const defaultAvatarSrc = 'https://www.gravatar.com/avatar/?d=mp&f=y'; // Default avatar


defineEmits(['toggle-sidebar-mobile'])
const auth = useAuthStore()
const isScrolled = ref(false)
// To store the actual scrollable element, which could be an HTMLElement or the Window
const scrollTargetRef = ref<HTMLElement | Window | null>(null)

const avatarUrl = computed(() => {
  // ตรวจสอบว่า auth.user และ auth.user.avatar_url มีค่า และไม่ใช่ string ว่าง
  console.log('Topbar: auth.user.avatar_url:', auth.user?.avatar_url);
  if (auth.user && typeof auth.user.avatar_url === 'string' && auth.user.avatar_url?.trim() !== '') {
    const avatarPath = auth.user.avatar_url;

    // Check if avatar_url is a full URL or a relative path
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }

    // สำหรับ relative path, สร้าง URL เต็ม และตรวจสอบว่า config.apiUrl มีค่า
    if (config.apiUrl) {
      // ตรวจสอบให้แน่ใจว่า config.apiUrl ไม่ใช่ undefined ก่อนใช้ replace
      const baseUrl = String(config.apiUrl).replace('/api', '');
      return `${baseUrl}${avatarPath}`;
    } else {
      console.warn('Topbar: config.apiUrl is not defined. Cannot construct full avatar URL for relative path. Falling back to default.');
      return defaultAvatarSrc; // หาก config.apiUrl ไม่มีค่า ให้ใช้ default
    }
  }
  return defaultAvatarSrc; // Fallback หาก user หรือ avatar_url ไม่มีค่า
});
const handleScroll = () => {
    if (!scrollTargetRef.value) return

    if (scrollTargetRef.value instanceof Window) {
        isScrolled.value = scrollTargetRef.value.scrollY > 0 // Check window scroll position
    } else {
        // It's an HTMLElement, check its scrollTop
        isScrolled.value = (scrollTargetRef.value as HTMLElement).scrollTop > 0
    }
}

const headerClass = computed(() => {
    return isScrolled.value ? 'bg-transparent shadow-none' : 'bg-white shadow';
})

onMounted(() => {
    const vm = getCurrentInstance()
    // Removed appLayoutElement, directly assign to scrollTargetRef
    // Find the .main-content ancestor to attach the scroll listener
    if (vm && vm.proxy && vm.proxy.$el) {
        let parent = vm.proxy.$el.parentElement
        while (parent) {
            // Changed from 'app-layout' to 'main-content'
            if (parent.classList.contains('main-content-area')) { // Target the new scrollable container
                scrollTargetRef.value = parent
                break
            }
            parent = parent.parentElement
        }
    }
    // Fallback to window if .main-content is not found or not the scroller
    if (!scrollTargetRef.value) {
        scrollTargetRef.value = window;
    }
    (scrollTargetRef.value as HTMLElement | Window).addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Call once on mount to set initial state
})

onUnmounted(() => {
    if (scrollTargetRef.value) {
        scrollTargetRef.value.removeEventListener('scroll', handleScroll)
    }
})
</script>