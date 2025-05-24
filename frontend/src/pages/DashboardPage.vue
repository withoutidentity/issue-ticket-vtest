<template>
  <AppLayout>
    <card>
      <cardcontent>
        <cardtitle>รายการแจ้งปัญหา</cardtitle>
        <div class="space-y-6 overflow-y-auto overflow-x-auto truncate">
          <AdminDashboard
            v-if="auth.user.role === 'ADMIN'"
            @filter-status-changed="handleStatusFilterChange" 
            @filter-type-changed="handleTypeFilterChange"
            @filter-creation-date-changed="handleCreationDateFilterChange"
            @filter-department-changed="handleDepartmentFilterChange"
          />
          <OfficerDashboard 
            v-else-if="auth.user.role === 'OFFICER'" 
            @filter-officer-status-changed="handleOfficerStatusFilterChange" 
            @filter-officer-category-changed="handleOfficerCategoryFilterChange"
          />
          <div class="rounded-lg overflow-hidden border border-gray-200">
            <!-- Ticket Table -->
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="text-left py-3 px-4 font-medium text-gray-700">ลำดับ</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">เลขอ้างอิง</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">หัวข้อ</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">คำอธิบาย</th>
              <th class="text-left py-3 px-4 font-medium text-gray-700">แผนก</th>
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
              <td class="py-3 px-4 text-gray-700">{{ ticket.reference_number }}</td>
              <td class="py-3 px-4 text-gray-700 font-medium">{{ ticket.title }}</td>
              <td class="py-3 px-4 text-gray-600">{{ ticket.description }}</td>
              <td class="py-3 px-4 text-gray-700">
                {{ ticket.department?.name || "-" }}
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
import OfficerDashboard from "@/components/OfficerDashboard.vue"; // Import OfficerDashboard

import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useTicketStore } from "@/stores/ticketStore"; // Import ticket store
import { config } from "@/config";
import { useRouter } from 'vue-router'
import api from '@/api/axios-instance'

const router = useRouter()
function goToTicket(id: number) {
  router.push(`/tickets/${id}`)
}

interface ticket {
  id: number;
  reference_number: string;
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
    id: number;
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

const auth = useAuthStore();
const ticketStore = useTicketStore(); // Use the ticket store
const editStatus = ref<ticket | null>(null)
const selectedStatus = ref('open')

const statusFilterForTable = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilterForTable = ref<string | null>(null);
const departmentFilterForTable = ref<string | null>(null);
const officerStatusFilterForTable = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null); // For Officer's own status filter
const officerCategoryFilterForTable = ref<string | null>(null); // For Officer's category filter
const creationDateFilterForTable = ref<CreationDateFilter | null>(null);

const handleStatusFilterChange = (newStatus: 'open' | 'in_progress' | 'pending' | 'closed' | null) => {
  statusFilterForTable.value = newStatus;
  if (newStatus) { // If a status filter is applied, clear other filters
    typeFilterForTable.value = null;
    departmentFilterForTable.value = null;
    creationDateFilterForTable.value = null;
    officerCategoryFilterForTable.value = null;
    officerStatusFilterForTable.value = null; // Clear officer's own status filter
  }
};

const handleTypeFilterChange = (newType: string | null) => {
  typeFilterForTable.value = newType;
  if (newType) { // If a type filter is applied, clear other filters
    statusFilterForTable.value = null;
    departmentFilterForTable.value = null;
    creationDateFilterForTable.value = null;
    officerCategoryFilterForTable.value = null;
    officerStatusFilterForTable.value = null;
  }
};

const handleDepartmentFilterChange = (newDepartment: string | null) => {
  departmentFilterForTable.value = newDepartment;
  if (newDepartment) {
    statusFilterForTable.value = null;
    typeFilterForTable.value = null;
    creationDateFilterForTable.value = null;
    officerCategoryFilterForTable.value = null;
    officerStatusFilterForTable.value = null;
  }
};

const handleCreationDateFilterChange = (newCreationDateFilter: CreationDateFilter | null) => {
  creationDateFilterForTable.value = newCreationDateFilter;
  if (newCreationDateFilter) { // If a creation date filter is applied, clear other filters
    statusFilterForTable.value = null;
    typeFilterForTable.value = null;
    departmentFilterForTable.value = null;
    officerCategoryFilterForTable.value = null;
    officerStatusFilterForTable.value = null;
  }
};

const handleOfficerStatusFilterChange = (newStatus: 'open' | 'in_progress' | 'pending' | 'closed' | null) => {
  officerStatusFilterForTable.value = newStatus;
  // When officer filters by their dashboard's status cards, clear other admin-level filters
  statusFilterForTable.value = null;
  typeFilterForTable.value = null;
  departmentFilterForTable.value = null;
  creationDateFilterForTable.value = null;
  officerCategoryFilterForTable.value = null;
  // The base officer department filter in filteredTableTickets will still apply
};

const handleOfficerCategoryFilterChange = (newCategory: string | null) => {
  officerCategoryFilterForTable.value = newCategory;
  // When officer filters by category, clear other admin-level and officer status filters
  statusFilterForTable.value = null;
  typeFilterForTable.value = null;
  departmentFilterForTable.value = null;
  creationDateFilterForTable.value = null;
  officerStatusFilterForTable.value = null;
  // The base officer department filter in filteredTableTickets will still apply
};

const filteredTableTickets = computed(() => {
  // console.log("[DashboardPage] Recalculating filteredTableTickets...");
  // Log a deep copy of auth.user to avoid issues with reactivity proxies in console
  // console.log("[DashboardPage] Current auth user:", JSON.parse(JSON.stringify(auth.user)));
  // console.log("[DashboardPage] Raw tickets count from store:", ticketStore.tickets.length);
  // if (ticketStore.tickets.length > 0) {
    // console.log("[DashboardPage] First raw ticket department object from store:", ticketStore.tickets[0].department);
  // }

  let baseTickets = [...ticketStore.tickets]; // Use tickets from the store

  // Apply officer department filter first if applicable
  if (auth.user?.role === 'OFFICER') {
    const officerDepartmentId = auth.user?.department?.id; // Safer access
    // console.log(`[DashboardPage] Officer role detected. Officer's department ID from auth store: ${officerDepartmentId}`);

    if (officerDepartmentId !== undefined && officerDepartmentId !== null) {
      baseTickets = baseTickets.filter(ticket => {
        // console.log(`[DashboardPage] Comparing Ticket ID ${ticket.id} (Dept ID: ${ticket.department?.id}) with Officer Dept ID ${officerDepartmentId}. Match: ${ticket.department?.id === officerDepartmentId}`);
        return ticket.department?.id === officerDepartmentId;
      });
      // console.log(`[DashboardPage] Tickets count after officer department filter (ID: ${officerDepartmentId}): ${baseTickets.length}`);
    } else {
      // console.warn(`[DashboardPage] Officer's department ID is undefined or null. No department-specific tickets will be shown for this officer.`);
      baseTickets = []; // Officer with no department ID sees no tickets
    }
  }

  let tempTickets = baseTickets;

  // Apply Officer's own status filter first if it's active
  if (officerStatusFilterForTable.value && auth.user?.role === 'OFFICER') {
    tempTickets = tempTickets.filter(ticket => ticket.status === officerStatusFilterForTable.value);
  } 
  // Apply Officer's category filter if active
  else if (officerCategoryFilterForTable.value && auth.user?.role === 'OFFICER') {
    tempTickets = tempTickets.filter(ticket => ticket.ticket_types?.name === officerCategoryFilterForTable.value);
  }
  // Then apply Admin's filters if active (these would have cleared officerStatusFilterForTable)
  else if (statusFilterForTable.value) { // Admin status filter
    tempTickets = tempTickets.filter(ticket => ticket.status && ticket.status === statusFilterForTable.value);
  } else if (typeFilterForTable.value) {
    tempTickets = tempTickets.filter(ticket => ticket.ticket_types?.name === typeFilterForTable.value);
  } else if (departmentFilterForTable.value && auth.user.role === 'ADMIN') { // Department filter from AdminDashboard
    tempTickets = tempTickets.filter(ticket => ticket.department?.name === departmentFilterForTable.value);
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
  // console.log("[DashboardPage] Final filtered tickets count:", tempTickets.length);
  return tempTickets;
});

onMounted(async () => {
  // console.log("DashboardPage: Component mounted.");
  // Ensure tickets are fetched via the store if not already loaded.
  // The store should handle the logic of not re-fetching if data is fresh.
  if (!ticketStore.tickets || ticketStore.tickets.length === 0) {
    // console.log("DashboardPage: Tickets not in store or empty, calling ticketStore.fetchTickets().");
    await ticketStore.fetchTickets();
    // console.log("DashboardPage: ticketStore.fetchTickets() completed. Tickets in store:", ticketStore.tickets.length);
  } else {
    // console.log("DashboardPage: Tickets already in store. Count:", ticketStore.tickets.length);
  }
});

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
  await ticketStore.fetchTickets(); // Re-fetch tickets via store after update
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
