<template>
  <AppLayout>
    <TicketForm />
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { useAuthStore } from '@/stores/auth'
import TicketForm from '@/components/tickekform.vue'
const auth = useAuthStore()
</script>
  
