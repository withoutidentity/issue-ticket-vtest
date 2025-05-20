<template>
  <AppLayout>
    <cardtitle>รายการแจ้งปัญหา</cardtitle>
    <card>
      <cardcontent>
        <div class="space-y-6 overflow-y-auto overflow-x-auto truncate">
          <AdminDashboard 
            v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'" 
            @filter-status-changed="handleStatusFilterChange" 
            @filter-type-changed="handleTypeFilterChange"
            @filter-creation-date-changed="handleCreationDateFilterChange" />
          <div class="rounded-lg overflow-hidden border border-gray-200">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="text-left py-3 px-4 font-medium text-gray-700">ลำดับ</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">หัวข้อ</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">คำอธิบาย</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">ประเภท</th>
              <th class="text-center py-3 px-4 font-medium text-gray-700">สถานะ</th>
              <th v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'"
                class="text-left py-3 px-4 font-medium text-gray-700">ผู้แจ้ง</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">วันที่สร้าง</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">ชื่อผู้รับผิดชอบ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ticket, index) in filteredTableTickets" :key="ticket.id"
                class="border-b align-top hover:bg-gray-50 cursor-pointer"
                @click="goToTicket(ticket.id)">
              <td class="py-3 px-4 text-gray-700">{{ index+1 }}</td>
              <td class="py-3 px-4 text-gray-700 font-medium">{{ ticket.title }}</td>
              <td class="py-3 px-4 text-gray-600">{{ ticket.description }}</td>
              <td class="py-3 px-4 text-gray-700">
                {{ ticket.ticket_types?.name || "-" }}
              </td>
              <td class="py-3 px-4 text-center">
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
              <td v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'" class="py-3 px-4 text-gray-700">
                {{ ticket.user?.name || "-" }}
              </td>
              <td class="py-3 px-4 text-gray-700">
                {{ formatDateDDMMYYYY(ticket.created_at) }}
              </td>
              <td class="py-3 px-4 text-gray-700">
                {{ ticket.assignee?.name || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
  department?: { // Ensure department includes id
    id?: number;
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

// Define Period and CreationDateFilter types, similar to AdminDashboard
type Period = 'day' | 'month' | 'year';
interface CreationDateFilter {
  period: Period;
  value: string; // This is the YYYY-MM-DD, YYYY-MM, or YYYY string
}

const tickets = ref<ticket[]>([])
const auth = useAuthStore();
const editStatus = ref<ticket | null>(null)
const selectedStatus = ref('open')

const statusFilterForTable = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilterForTable = ref<string | null>(null);
const creationDateFilterForTable = ref<CreationDateFilter | null>(null);

const handleStatusFilterChange = (newStatus: 'open' | 'in_progress' | 'pending' | 'closed' | null) => {
  statusFilterForTable.value = newStatus;
  if (newStatus) { // If a status filter is applied, clear other filters
    typeFilterForTable.value = null;
    creationDateFilterForTable.value = null;
  }
};

const handleTypeFilterChange = (newType: string | null) => {
  typeFilterForTable.value = newType;
  if (newType) { // If a type filter is applied, clear other filters
    statusFilterForTable.value = null;
    creationDateFilterForTable.value = null;
  }
};

const handleCreationDateFilterChange = (newCreationDateFilter: CreationDateFilter | null) => {
  creationDateFilterForTable.value = newCreationDateFilter;
  if (newCreationDateFilter) { // If a creation date filter is applied, clear other filters
    statusFilterForTable.value = null;
    typeFilterForTable.value = null;
  }
};

const filteredTableTickets = computed(() => {
  console.log("[DashboardPage] Recalculating filteredTableTickets...");
  // Log a deep copy of auth.user to avoid issues with reactivity proxies in console
  console.log("[DashboardPage] Current auth user:", JSON.parse(JSON.stringify(auth.user)));
  console.log("[DashboardPage] Raw tickets count:", tickets.value.length);
  if (tickets.value.length > 0) {
    console.log("[DashboardPage] First raw ticket department object:", tickets.value[0].department);
  }

  let baseTickets = [...tickets.value]; // Start with a shallow copy

  // Apply officer department filter first if applicable
  if (auth.user?.role === 'OFFICER') {
    const officerDepartmentId = auth.user?.department?.id; // Safer access
    console.log(`[DashboardPage] Officer role detected. Officer's department ID from auth store: ${officerDepartmentId}`);

    if (officerDepartmentId !== undefined && officerDepartmentId !== null) {
      baseTickets = baseTickets.filter(ticket => {
        // console.log(`[DashboardPage] Comparing Ticket ID ${ticket.id} (Dept ID: ${ticket.department?.id}) with Officer Dept ID ${officerDepartmentId}. Match: ${ticket.department?.id === officerDepartmentId}`);
        return ticket.department?.id === officerDepartmentId;
      });
      console.log(`[DashboardPage] Tickets count after officer department filter (ID: ${officerDepartmentId}): ${baseTickets.length}`);
    } else {
      console.warn(`[DashboardPage] Officer's department ID is undefined or null. No department-specific tickets will be shown for this officer.`);
      baseTickets = []; // Officer with no department ID sees no tickets
    }
  }

  let tempTickets = baseTickets;

  if (statusFilterForTable.value) {
    tempTickets = tempTickets.filter(ticket => ticket.status && ticket.status === statusFilterForTable.value);
  } else if (typeFilterForTable.value) {
    tempTickets = tempTickets.filter(ticket => ticket.ticket_types?.name === typeFilterForTable.value);
  } else if (creationDateFilterForTable.value && creationDateFilterForTable.value.value) {
    const { period, value: filterValue } = creationDateFilterForTable.value;    tempTickets = tempTickets.filter(ticket => {
      const createdAt = new Date(ticket.created_at);
      let ticketKey = '';
      if (period === 'day') ticketKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
      else if (period === 'month') ticketKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      else if (period === 'year') ticketKey = `${createdAt.getFullYear()}`;
      return ticketKey === filterValue;
    });
  }
  console.log("[DashboardPage] Final filtered tickets count:", tempTickets.length);
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
