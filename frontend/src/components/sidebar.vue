<template>
    <aside class="w-64 bg-black text-white h-screen">
        <router-link :to="isAdmin ? '/admin' : '/home'" class="border-b-2 border-[#333333] w-full">
            <div class="p-4">
                <h1 class="text-lg font-bold">Issue Ticket System</h1>
                <h2 class="text-[#6C6B6B]">ระบบแจ้งปัญหา</h2>
            </div>
        </router-link>
        <nav class="space-y-4 p-4" v-if="isAdmin">
            <button @click="admindashboard" class="w-full text-center hover:bg-gray-800 p-2 rounded">Dashboard</button>
            <button @click="Setting" class="w-full text-center hover:bg-gray-800 p-2 rounded">Setting</button>
            <button @click="profile" class="w-full text-center hover:bg-gray-800 p-2 rounded">Profile</button>
            <button @click="logout" class="w-full text-center hover:bg-gray-800 p-2 rounded">Logout</button>
        </nav>

        <nav class="space-y-4 p-4" v-else-if="isUser">
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

const isAdmin = auth.isAdmin
const isUser = auth.isUser

const logout = () => {
    auth.logout()
    router.push('/')
}
//user
const dashboard = () => {
    router.push('/dashboard')
}

const newticket = () => {
    router.push('/home')
}

const profile = () => {
    router.push('/profile')
}

//admin
const admindashboard = () => {
    router.push('/admin')
}

const Setting = () => {
    router.push('/setting')
}

</script>
