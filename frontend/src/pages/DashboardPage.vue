<template>
  <AppLayout>
    <div class="p-4">
      <h1 class="text-xl font-bold mb-4">รายงาน Ticket</h1>
      <table class="min-w-full border">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 border">หัวข้อ</th>
            <th class="p-2 border">คำอธิบาย</th>
            <th class="p-2 border">ประเภท</th>
            <th class="p-2 border">สถานะ</th>
            <th class="p-2 border">ผู้แจ้ง</th>
            <th class="p-2 border">วันที่สร้าง</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ticket in tickets"
            :key="ticket.id"
            class="hover:bg-gray-100"
          >
            <td class="p-2 border">{{ ticket.title }}</td>
            <td class="p-2 border">{{ ticket.description }}</td>
            <td class="p-2 border">{{ ticket.ticket_types?.name || "-" }}</td>
            <td class="p-2 border">{{ ticket.status }}</td>
            <td class="p-2 border">{{ ticket.user?.name || "-" }}</td>
            <td class="p-2 border">
              {{ new Date(ticket.created_at).toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { config } from "@/config";

const tickets = ref([]);
const auth = useAuthStore();

onMounted(async () => {
  try {
    const res = await axios.get(`${config.apiUrl}/api/tickets`, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    tickets.value = res.data;
  } catch (err) {
    console.error("Failed to load tickets", err);
  }
});
</script>
