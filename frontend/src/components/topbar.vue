<template>
    <header class="bg-white shadow px-6 py-3 flex justify-end">
        <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-black rounded-full"></div>
            <span>{{ auth.user.name }}</span>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>