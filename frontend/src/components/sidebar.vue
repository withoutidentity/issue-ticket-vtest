<template>
    <aside class="w-64 bg-black text-white h-screen">
        <div @click="newticket" class="border-b-2 border-[#333333] w-full">
            <div class="p-4">
                <h1 class="text-lg font-bold">Issue Ticket System</h1>
                <h2 class="text-[#6C6B6B]">ระบบแจ้งปัญหา</h2>
            </div>
        </div>
        <nav class="space-y-4 p-4">
            <button @click="newticket" class="w-full text-center hover:bg-gray-800 p-2 rounded">New Ticket</button>
            <button @click="dashboard" class="w-full text-center hover:bg-gray-800 p-2 rounded">Dashboard</button>
            <button @click="profile" class="w-full text-center hover:bg-gray-800 p-2 rounded">Profile</button>
            <button @click="logout" class="w-full text-center hover:bg-gray-800 p-2 rounded">Logout</button>
        </nav>
    </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
    auth.logout()
    router.push('/')
}

const dashboard = () => {
    router.push('/dashboard')
}

const newticket = () => {
    router.push('/home')
}

const profile = () => {
    router.push('/profile')
}
</script>


