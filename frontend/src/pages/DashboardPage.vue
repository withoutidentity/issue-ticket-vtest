<template>
  <AppLayout>
    <card>
      <cardcontent>
        <!-- <cardtitle>Dashboard</cardtitle> -->
        <div class="space-y-6 overflow-y-auto overflow-x-auto truncate">
          <AdminDashboard v-if="auth.user.role === 'ADMIN'" @filter-status-changed="handleStatusFilterChange"
            @filter-type-changed="handleTypeFilterChange" @filter-creation-date-changed="handleCreationDateFilterChange"
            @filter-department-changed="handleDepartmentFilterChange" />
          <OfficerDashboard v-else-if="auth.user.role === 'OFFICER'"
            @filter-officer-status-changed="handleOfficerStatusFilterChange"
            @filter-officer-category-changed="handleOfficerCategoryFilterChange" />
        </div>
      </cardcontent>
    </card>

    <card>
      <cardcontent>
        <div class="flex justify-between items-center mb-4">
            <!-- Left side: Title -->
            <cardtitle>รายการแจ้งปัญหา</cardtitle>

            <!-- Right side: Search, Filter, Reset -->
            <div class="flex items-center">
              <!-- Left side: Search, Filter, Reset -->
              <div class="flex items-center space-x-3">
                <!-- Search box -->
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input type="text" v-model="searchQuery"
                    class="w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-all duration-200"
                    placeholder="ค้นหาหัวข้อ, เลขอ้างอิง, ชื่อผู้แจ้ง..." />
                </div>

                <!-- Filter button -->
                <div class="relative" ref="statusFilterDropdown">
                  <button @click="toggleStatusFilterDropdown"
                    class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                    <!-- Filter Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-1.414.914l-2-1A1 1 0 0110 19.414V13.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  <!-- Dropdown List -->
                  <div v-if="isStatusFilterDropdownOpen"
                       class="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 right-0">
                    <ul class="py-1">
                      <li @click="selectStatusFilter(null)"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        ทั้งหมด
                      </li>
                      <li @click="selectStatusFilter('open')"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        ใหม่
                      </li>
                      <li @click="selectStatusFilter('in_progress')"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        กำลังดำเนินการ
                      </li>
                      <li @click="selectStatusFilter('closed')"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        เสร็จสิ้น
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Reset button -->
                <button @click="resetFilters"
                  class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
        </div>

          <!-- ส่วนควบคุมจำนวนรายการต่อหน้า -->
        <div
            class="flex items-center space-x-2 mt-4 md:mt-0 justify-start md:justify-end col-span-1 md:col-span-2 lg:col-span-1">
            <label for="perPageDashboardInput" class="text-sm text-gray-600">แสดง:</label>
            <input id="perPageDashboardInput" type="number" min="1" v-model.number="perPage"
              class="w-16 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
            <span class="text-sm text-gray-600">รายการต่อหน้า</span>
        </div>

        <div class="mt-3 rounded-lg overflow-hidden overflow-x-auto border border-gray-200">
            <!-- Ticket Table -->
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-left py-3 px-4 font-medium text-gray-700">เลขอ้างอิง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">หัวข้อ</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">คำอธิบาย</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">แผนก</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-700">สถานะ</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">ผู้แจ้ง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">วันที่สร้าง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">ชื่อผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in paginatedTickets" :key="ticket.id"
                  class="text-sm border-b align-top hover:bg-gray-50 cursor-pointer" @click="goToTicket(ticket.id)">
                  <td class="py-3 px-4 text-gray-700">{{ ticket.reference_number }}</td>
                  <td class="py-3 px-4 text-gray-700 font-medium">{{ ticket.title }}</td>
                  <td class="py-3 px-4 text-gray-600">{{ ticket.description }}</td>
                  <td class="py-3 px-4 text-gray-700">
                    <span class="uppercase">{{ ticket.department?.name || "-" }}</span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div>
                      <span :class="{
                        'bg-blue-100 text-blue-700': ticket.status === 'open',
                        'bg-orange-100 text-orange-700': ticket.status === 'in_progress',
                        'bg-purple-100 text-purple-700': ticket.status === 'pending',
                        'bg-green-100 text-green-700': ticket.status === 'closed',
                      }" class="px-3 py-1 rounded-full text-sm ">
                        {{ statusName(ticket.status) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-700">
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
          <!-- Pagination Controls -->
        <div v-if="totalPages > 0 && totalPages > 1" class="mt-6 flex justify-between items-center">
            <button @click="prevPage" :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ก่อนหน้า
            </button>
            <span class="text-sm text-gray-700">
              หน้า {{ currentPage }} จาก {{ totalPages }}
            </span>
            <button @click="nextPage" :disabled="currentPage === totalPages"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ถัดไป
            </button>
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
import { searchTickets, statusName as utilStatusName, formatDateDDMMYYYY as utilFormatDate, Ticket as UtilTicket } from '@/utils/ticketUtils';

import { ref, onMounted, onUnmounted, computed, watch } from "vue";
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

// ทำให้ interface ticket ในหน้านี้สืบทอดคุณสมบัติจาก UtilTicket
// เพื่อให้แน่ใจว่า type พื้นฐานสอดคล้องกัน
// หากต้องการคุณสมบัติเพิ่มเติมหรือแก้ไขคุณสมบัติบางอย่างสำหรับ DashboardPage โดยเฉพาะ
// สามารถทำได้ที่นี่ แต่ต้องระวังเรื่องความเข้ากันได้ของ type
// สำคัญ: UtilTicket ใน ticketUtils.ts จะต้องถูกกำหนดไว้อย่างถูกต้อง
// โดยเฉพาะ ticket_types.id ควรเป็น optional (id?: number)
interface ticket extends UtilTicket {
  // หาก UtilTicket มีคุณสมบัติครบถ้วนและถูกต้องตามที่หน้านี้ต้องการ
  // ส่วนนี้อาจจะว่างไว้ หรือมีเฉพาะคุณสมบัติที่ต้องการเพิ่มเติม/แก้ไขจริงๆ
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
const searchQuery = ref('');
const perPage = ref(10);
const currentPage = ref(1);

const statusFilterForTable = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilterForTable = ref<string | null>(null);
const departmentFilterForTable = ref<string | null>(null);
const officerStatusFilterForTable = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null); // For Officer's own status filter
const officerCategoryFilterForTable = ref<string | null>(null); // For Officer's category filter
const creationDateFilterForTable = ref<CreationDateFilter | null>(null);

const isStatusFilterDropdownOpen = ref(false);
const statusFilterDropdown = ref<HTMLElement | null>(null); // Ref for the dropdown element

const handleStatusFilterChange = (newStatus: 'open' | 'in_progress' | 'pending' | 'closed' | null) => {
  statusFilterForTable.value = newStatus;
  // When AdminDashboard sets a status, clear other AdminDashboard specific filters
  if (newStatus !== null) {
    typeFilterForTable.value = null;
    departmentFilterForTable.value = null;
    creationDateFilterForTable.value = null;
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

const filteredTableTickets = computed((): ticket[] => { // กำหนด type การคืนค่าให้ชัดเจน
  // เริ่มต้นด้วย type UtilTicket[] จาก store
  let processingTickets: UtilTicket[] = [...ticketStore.tickets];

  // 1. Officer's department filter (if user is Officer)
  if (auth.user?.role === 'OFFICER') {
    const officerDepartmentId = auth.user?.department?.id;
    if (officerDepartmentId !== undefined && officerDepartmentId !== null) {
      processingTickets = processingTickets.filter(ticket => ticket.department?.id === officerDepartmentId);
    } else {
      processingTickets = [];
    }
  }

  // 2. Apply active filter from AdminDashboard or OfficerDashboard events
  //    The handle... functions ensure that only one of these high-level filters is active at a time
  //    by clearing others. For example, handleTypeFilterChange clears statusFilterForTable.
  // processingTickets ยังคงเป็น UtilTicket[] ตลอดการกรองเหล่านี้

  if (officerStatusFilterForTable.value && auth.user?.role === 'OFFICER') {
    processingTickets = processingTickets.filter(t => t.status === officerStatusFilterForTable.value);
  }
  else if (officerCategoryFilterForTable.value && auth.user?.role === 'OFFICER') {
    processingTickets = processingTickets.filter(t => t.ticket_types?.name === officerCategoryFilterForTable.value);
  }
  // Admin Dashboard Filters
  // Note: statusFilterForTable is also v-model for the local dropdown.
  // If typeFilter, departmentFilter, or creationDateFilter are set by AdminDashboard,
  // their respective handle... functions will clear statusFilterForTable.
  else if (typeFilterForTable.value) {
    processingTickets = processingTickets.filter(t => t.ticket_types?.name === typeFilterForTable.value);
  }
  else if (departmentFilterForTable.value && auth.user.role === 'ADMIN') {
    processingTickets = processingTickets.filter(t => t.department?.name === departmentFilterForTable.value);
  }
  else if (creationDateFilterForTable.value && creationDateFilterForTable.value.value) {
    const { period, value: filterValue } = creationDateFilterForTable.value;
    processingTickets = processingTickets.filter(ticket_item => {
      const createdAt = new Date(ticket_item.created_at);
      let ticketKey = '';
      if (period === 'day') ticketKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
      else if (period === 'month') ticketKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      else if (period === 'year') ticketKey = `${createdAt.getFullYear()}`;
      return ticketKey === filterValue;
    });
  }
  // This applies if statusFilterForTable is set (by AdminDashboard's status cards OR local dropdown)
  // AND no other AdminDashboard filter (type, department, date) took precedence.
  else if (statusFilterForTable.value) {
    processingTickets = processingTickets.filter(t => t.status === statusFilterForTable.value);
  }

  // 3. Apply local searchQuery (from DashboardPage's own input)
  // searchedResult จะเป็น UtilTicket[]
  let searchedResult: UtilTicket[] = processingTickets;
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    // searchTickets รับ UtilTicket[] และคืนค่า UtilTicket[]
    searchedResult = searchTickets(processingTickets, searchQuery.value);
  }
  // เนื่องจาก interface ticket extends UtilTicket และควรจะเข้ากันได้
  // การ cast (as ticket[]) ตรงนี้จะปลอดภัย
  // และทำให้ type ที่คืนค่าตรงกับที่ระบุไว้สำหรับ computed property
  return searchedResult as ticket[];
});

const totalPages = computed(() => {
  if (perPage.value <= 0) return 0;
  return Math.ceil(filteredTableTickets.value.length / perPage.value);
});

const paginatedTickets = computed(() => {
  if (totalPages.value === 0) return [];
  const start = (currentPage.value - 1) * Number(perPage.value); // Ensure perPage is treated as number
  const end = start + perPage.value;
  return filteredTableTickets.value.slice(start, end);
});

onMounted(async () => {
  // console.log("DashboardPage: Component mounted.");
  // Ensure tickets are fetched via the store if not already loaded.
  // The store should handle the logic of not re-fetching if data is fresh.
  if (!ticketStore.tickets || ticketStore.tickets.length === 0) {
    ticketStore.fetchTickets();
  }
  // Add event listener for clicks outside the status filter dropdown
  document.addEventListener('click', handleClickOutsideStatusFilter);
});

onUnmounted(() => {
  // Remove event listener when component is unmounted
  document.removeEventListener('click', handleClickOutsideStatusFilter);
});

const toggleStatusFilterDropdown = () => {
  isStatusFilterDropdownOpen.value = !isStatusFilterDropdownOpen.value;
};

const selectStatusFilter = (status: 'open' | 'in_progress' | 'pending' | 'closed' | null) => {
  statusFilterForTable.value = status; // This will trigger the handleStatusFilterChange if you want to keep that logic
  isStatusFilterDropdownOpen.value = false;
};

const handleClickOutsideStatusFilter = (event: MouseEvent) => {
  if (statusFilterDropdown.value && !statusFilterDropdown.value.contains(event.target as Node)) {
    isStatusFilterDropdownOpen.value = false;
  }
};
watch([searchQuery, perPage, statusFilterForTable, typeFilterForTable, departmentFilterForTable, creationDateFilterForTable, officerStatusFilterForTable, officerCategoryFilterForTable], () => {
  currentPage.value = 1;
});

watch(currentPage, (newPage) => {
  if (totalPages.value > 0) { // Only adjust if there are pages
    if (newPage < 1) {
      currentPage.value = 1;
    } else if (newPage > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  } else if (newPage !== 1) { // If no pages, current page should be 1
    currentPage.value = 1;
  }
});

const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

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
      return "รอดำเนินการ";
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

const resetFilters = () => {
  searchQuery.value = '' // ล้างการค้นหา
  statusFilterForTable.value = null // กลับไปแสดงทั้งหมด
  perPage.value = 10 // รีเซ็ตเป็นค่าเริ่มต้น

  currentPage.value = 1;

  // Reset filters that might have been set by AdminDashboard/OfficerDashboard
  typeFilterForTable.value = null;
  departmentFilterForTable.value = null;
  creationDateFilterForTable.value = null;
  officerStatusFilterForTable.value = null;
  officerCategoryFilterForTable.value = null;

  // Note: The handle... functions already clear other related filters when one is set.
  // This reset ensures everything goes back to default.
}

</script>
