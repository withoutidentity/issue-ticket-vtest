<template>
  <AppLayout>
    <cardtitle>รายการแจ้งปัญหา</cardtitle>
    <card>
      <cardcontent>
        <div class="space-y-6 overflow-y-auto overflow-x-auto truncate">
          <AdminDashboard v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'" @filter-status-changed="handleStatusFilterChange" @filter-type-changed="handleTypeFilterChange" />
          <table class="w-full">
            <thead>
              <tr class="bg-gray-200">
                <th class="text-left py-3 px-4 font-medium">ลำดับ</th>
                <th class="text-left py-3 px-4 font-medium">หัวข้อ</th>
                <th class="text-left py-3 px-4 font-medium">คำอธิบาย</th>
                <th class="text-left py-3 px-4 font-medium">ประเภท</th>
                <th class="text-center py-3 px-4 font-medium">สถานะ</th>
                <th v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'"
                  class="text-left py-3 px-4 font-medium">ผู้แจ้ง</th>
                <th class="text-left py-3 px-4 font-medium">วันที่สร้าง</th>
                <th class="text-left py-3 px-4 font-medium">ชื่อผู้รับผิดชอบ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ticket, index) in filteredTableTickets" :key="ticket.id"
                  class="border-b align-top hover:bg-gray-50 cursor-pointer"
                  @click="goToTicket(ticket.id)">
                <td class="py-3 px-4" >{{ index+1 }}</td>
                <td class="py-3 px-4" >{{ ticket.title }}</td>
                <td class="py-3 px-4" >{{ ticket.description }}</td>
                <td class="py-3 px-4" >
                  {{ ticket.ticket_types?.name || "-" }}
                </td>
                <td class="py-3 px-4 text-center">
                  <!-- update status-->
                  <!-- <div v-if="editStatus?.id === ticket.id" class="flex items-center space-x-2">
                    <select v-model="selectedStatus" class="border rounded px-2 py-1 focus:outline-none">
                      <option value="open">เปิด</option>
                      <option value="in_progress">กำลังดำเนินการ</option>
                      <option value="pending">รอดำเนินการ</option>
                      <option value="closed">ปิดแล้ว</option>
                    </select>
                    <button @click="updateStatus" class="text-green-600 hover:underline">บันทึก</button>
                    <button @click="cancelEdit" class="text-red-600 hover:underline">ยกเลิก</button>
                  </div> -->
                  <div>
                    <span :class="{
                      'bg-blue-100 text-blue-700': ticket.status === 'open',
                      'bg-green-100 text-green-700': ticket.status === 'in_progress',
                      'bg-purple-100 text-purple-700': ticket.status === 'pending',
                      'bg-red-100 text-red-700': ticket.status === 'closed',
                    }" class="px-3 py-1 rounded-full text-sm ">
                      {{ statusName(ticket.status) }}
                    </span>
                  </div>
                </td>
                <td v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'" class="py-3 px-4" 
                >
                {{ ticket.user?.name || "-" }}</td>
                <td class="py-3 px-4">
                  {{ formatDateDDMMYYYY(ticket.created_at) }}
                </td>
                <td class="py-3 px-4"> {{ ticket.assignee?.name || "-" }}
                  <!-- <Filelink :filePath="ticket.filepath" /> -->
                  <!-- <div v-if="ticket.files.length === 0" class="text-gray-400 italic">ไม่มีไฟล์แนบบบ</div>
                  <div v-else>
                    <ul>
                      <li v-for="file in ticket.files" :key="file.id">
                        <a :href="`${config.apiUrl}/uploads/${file.filename}`" target="_blank" rel="noopener noreferrer"
                          class="max-w-[200px] flex text-blue-600 hover:underline text-ellipsis overflow-hidden whitespace-nowrap">
                          • {{ file.filename }}
                        </a>
                      </li>
                    </ul>
                  </div> -->

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
import AdminDashboard from "./AdminDashboard.vue";

import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { config } from "@/config";
import { useRouter } from 'vue-router'
import api from '@/api/axios-instance'

const router = useRouter()

function goToTicket(id: number) {
  router.push(`/tickets/${id}`)
}

interface ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed'
  created_at: string;
  updated_at: string;
  department?: {
    name: string;
  }
  assignee: {
    name: string;
  }
  user?: {
    name: string;
    email: string;
  };
  ticket_types?: {
    name: string;
  };
  files: Array<{
    id: number;
    filename: string;
    filepath: string;
  }>;
}

const tickets = ref<ticket[]>([])
const auth = useAuthStore();
const editStatus = ref<ticket | null>(null)
const selectedStatus = ref('open')

const statusFilterForTable = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilterForTable = ref<string | null>(null);

const handleStatusFilterChange = (newStatus: 'open' | 'in_progress' | 'pending' | 'closed' | null) => {
  statusFilterForTable.value = newStatus;
};

const handleTypeFilterChange = (newType: string | null) => {
  typeFilterForTable.value = newType;
};

const filteredTableTickets = computed(() => {
  let tempTickets = tickets.value;

  // Filter by status
  if (statusFilterForTable.value) {
    tempTickets = tempTickets.filter(ticket => ticket.status && ticket.status === statusFilterForTable.value);
  }
  // Filter by type
  if (typeFilterForTable.value) {
    tempTickets = tempTickets.filter(ticket => ticket.ticket_types?.name === typeFilterForTable.value);
  }
  return tempTickets;
});

const fetchTickets = async () => {
  try {
    const res = await api.get('/tickets', {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    tickets.value = res.data;
  } catch (err) {
    console.error("Failed to load tickets", err);
  }
};

onMounted(fetchTickets)

const openEdit = (ticket: ticket) => {
  editStatus.value = ticket
  selectedStatus.value = ticket.status
}

const cancelEdit = () => {
  editStatus.value = null
}

const updateStatus = async () => {
  if (!editStatus.value) return
  await axios.put(`${config.apiUrl}/api/tickets/updateStatus/${editStatus.value.id}`, {
    status: selectedStatus.value,
  }, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
  })
  console.log('select status: ', selectedStatus.value)
  fetchTickets()
}

const statusName = (status: string) => {
  switch (status) {
    case "open":
      return "เปิด";
    case "in_progress":
      return "กำลังดำเนินการ";
    case "pending":
      return "รอดำเนินการ";
    case "closed":
      return "เสร็จสิ้น";
    default:
      return status;
  }
};

const formatDateDDMMYYYY = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0 ต้อง +1
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
</script>
