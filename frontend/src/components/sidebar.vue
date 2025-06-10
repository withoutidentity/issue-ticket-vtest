<template>
    <aside class="w-64 bg-black text-white h-screen flex flex-col relative"> <!-- Added relative for positioning -->
        <!-- Mobile Close Button -->
        <button
            @click="requestCloseMobileSidebar"
            class="md:hidden absolute top-2 right-2 text-gray-400 hover:text-white p-2 z-10 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <router-link :to="isAdmin || isOfficer ? '/dashboard' : '/home'" class="border-b-2 border-[#333333] w-full">
            <div class="p-4">
                <h1 class="text-lg font-bold">Issue Ticket System</h1>
                <h2 class="text-[#6C6B6B]">ระบบแจ้งปัญหา</h2>
            </div>
        </router-link>
        <nav class="space-y-4 p-4" v-if="isAdmin">
            <button @click="navigateTo('/dashboard')" class="w-full text-center hover:bg-gray-800 p-2 rounded">Dashboard</button>
            <button @click="navigateTo('/users')" class="w-full text-center hover:bg-gray-800 p-2 rounded">ผู้ใช้งาน</button>
            <button @click="navigateTo('/types')" class="w-full text-center hover:bg-gray-800 p-2 rounded">จัดการหมวดหมู่</button>
            <button @click="navigateTo('/departments')" class="w-full text-center hover:bg-gray-800 p-2 rounded">จัดการแผนก</button>
            <button @click="navigateTo('/profile')" class="w-full text-center hover:bg-gray-800 p-2 rounded">Profile</button>
        </nav>

        <nav class="space-y-4 p-4" v-else-if="isOfficer">
            <button @click="navigateTo('/home')" class="w-full text-center hover:bg-gray-800 p-2 rounded">New Ticket</button>
            <button @click="navigateTo('/MyTickets')" class="w-full text-center hover:bg-gray-800 p-2 rounded">My Ticket</button>
            <button @click="navigateTo('/dashboard')" class="w-full text-center hover:bg-gray-800 p-2 rounded">Dashboard</button>
            <button @click="navigateTo('/users')" class="w-full text-center hover:bg-gray-800 p-2 rounded">ผู้ใช้งาน</button>
            <button @click="navigateTo('/types')" class="w-full text-center hover:bg-gray-800 p-2 rounded">จัดการหมวดหมู่</button>
            <button @click="navigateTo('/departments')" class="w-full text-center hover:bg-gray-800 p-2 rounded">จัดการแผนก</button>
            <button @click="navigateTo('/profile')" class="w-full text-center hover:bg-gray-800 p-2 rounded">Profile</button>
        </nav>

        <nav class="space-y-4 p-4" v-else-if="isUser">
            <button @click="navigateTo('/home')" class="w-full text-center hover:bg-gray-800 p-2 rounded">New Ticket</button>
            <button @click="navigateTo('/MyTickets')" class="w-full text-center hover:bg-gray-800 p-2 rounded">My Ticket</button>
            <button @click="navigateTo('/profile')" class="w-full text-center hover:bg-gray-800 p-2 rounded">Profile</button>
        </nav>

        <div class="mt-auto p-4">
            <button @click="logout" class="w-full text-center hover:bg-gray-800 p-2 rounded">Logout</button>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
const emit = defineEmits(['navigated'])


const auth = useAuthStore()
const router = useRouter()

const isAdmin = auth.isAdmin
const isOfficer = auth.isOfficer
const isUser = auth.isUser

const logout = () => {
  Swal.fire({
    title: 'ออกจากระบบ?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText: 'อยู่ต่อ',
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // เรียก API logout
       auth.logout()
        Swal.fire({
          title: 'ลาก่อน!',
          text: 'ออกจากระบบสำเร็จแล้ว',
          icon: 'success',
          showClass: {
            popup: 'animate__animated animate__heartBeat'
          },
          timer: 2000
        }).then(() => {
          router.push('/')
      })
    }
  })
}

const navigateTo = (path: string) => {
  router.push(path)
  emit('navigated')
}

const requestCloseMobileSidebar = () => {
  emit('navigated'); // AppLayout listens to this event to close the mobile sidebar
}

</script>
