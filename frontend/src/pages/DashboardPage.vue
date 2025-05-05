<template>
  <AppLayout>
    <cardtitle>รายงาน Ticket</cardtitle>
    <card>
      <cardcontent>
        <div class="space-y-6 overflow-y-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-200">
                <th class="text-left py-3 px-4 font-medium">หัวข้อ</th>
                <th class="text-left py-3 px-4 font-medium">คำอธิบาย</th>
                <th class="text-left py-3 px-4 font-medium">ประเภท</th>
                <th class="text-left py-3 px-4 font-medium">สถานะ</th>
                <th  v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'" class="text-left py-3 px-4 font-medium">ผู้แจ้ง</th>
                <th class="text-left py-3 px-4 font-medium">วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ticket in tickets"
                :key="ticket.id"
                class="border-b hover:bg-gray-50"
              >
                <td class="py-3 px-4">{{ ticket.title }}</td>
                <td class="py-3 px-4">{{ ticket.description }}</td>
                <td class="py-3 px-4">{{ ticket.ticket_types?.name || "-" }}</td>
                <td class="py-3 px-4">{{ ticket.status }}</td>
                <td v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'" class="py-3 px-4">{{ ticket.user?.name || "-" }}</td>
                <td class="py-3 px-4">
                  {{ new Date(ticket.created_at).toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </cardcontent>
    </card>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';

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
