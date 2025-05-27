<template>
  <AppLayout>
    <!-- <cardtitle2>
    </cardtitle2> -->
    <card>
      <cardcontent>
        <div class="flex items-center justify-between mb-4">
          <div class="flex flex-col">
            <cardtitle>รายการแจ้งปัญหาของฉัน</cardtitle>
            <p class="text-sm text-gray-600 font-medium ml-3">
              ปัญหาของฉันทั้งหมด:
              <span class="text-blue-600 font-semibold">{{ officerCreatedTickets.length }}</span>
              <!-- (แสดงผล: 
            <span class="text-blue-600 font-semibold">{{ filteredAndSearchedTickets.length }}</span>) -->
            </p>
          </div>
          <div class="flex items-center">
            <div class="flex items-center space-x-3">
              <!-- ส่วนค้นหาและกรอง -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input type="text" v-model="searchQuery"
                  class="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  placeholder="ค้นหาหัวข้อ, เลขอ้างอิง, สถานะ..." />
              </div>

              <!-- Dropdown กรองสถานะ -->
              <div class="relative" ref="statusFilterDropdownMyTicketsRef">
                <button @click="toggleStatusFilterDropdownMyTickets"
                  class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                  <!-- Filter Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-1.414.914l-2-1A1 1 0 0110 19.414V13.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <!-- Dropdown List -->
                <div v-if="isStatusFilterDropdownOpenMyTickets"
                  class="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 right-0">
                  <ul class="py-1">
                    <li @click="selectStatusFilterMyTickets('total')"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      ทั้งหมด
                    </li>
                    <li @click="selectStatusFilterMyTickets('open')"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      ใหม่
                    </li>
                    <li @click="selectStatusFilterMyTickets('in_progress')"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      กำลังดำเนินการ
                    </li>
                    <li @click="selectStatusFilterMyTickets('closed')"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      เสร็จสิ้น
                    </li>
                    <!-- เพิ่ม 'pending' ถ้าต้องการ -->
                    <!-- <li @click="selectStatusFilterMyTickets('pending')"
                      class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                    รอดำเนินการ
                  </li> -->
                  </ul>
                </div>
              </div>

              <!-- Reset button -->
              <button @click="resetFilters"
                class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <!-- Export to Excel button -->
                <button @click="exportToExcel"
                  class="h-10 px-4 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Excel
                </button>
            </div>
          </div>
        </div>

        <!-- ปุ่มแสดงรายการต่อหน้า -->
        <div
          class="flex items-center space-x-2 mt-4 md:mt-0 justify-start md:justify-end col-span-1 md:col-span-2 lg:col-span-1">
          <label for="perPageInput" class="text-sm text-gray-600">แสดง:</label>
          <input id="perPageInput" type="number" min="1" v-model.number="perPage"
            class="w-12 px-2 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          <span class="text-sm text-gray-600">รายการต่อหน้า</span>
        </div>

        <div class="mt-6 space-y-6 overflow-y-auto overflow-x-auto truncate">
          <div v-if="isLoading" class="text-center py-4 text-gray-600">กำลังโหลดข้อมูล...</div>
          <div v-else-if="!filteredAndSearchedTickets.length" class="text-center py-4 text-gray-500">
            ไม่พบใบงานแจ้งปัญหาตามเงื่อนไข หรือคุณยังไม่ได้สร้างใบงานใดๆ
          </div>
          <div v-else class="rounded-lg overflow-hidden border border-gray-200">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-left py-3 px-4 font-medium text-gray-700">เลขอ้างอิง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">หัวข้อ</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">คำอธิบาย</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">แผนก</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-700">สถานะ</th>                  
                  <th 
                    @click="toggleSortDirection" 
                    class="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div class="flex items-center">
                      <span>วันที่สร้าง</span>
                      <svg v-if="sortDirection === 'asc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                      <svg v-if="sortDirection === 'desc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                      <svg v-if="!sortDirection" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 text-gray-400 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                    </div>
                  </th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">ชื่อผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in paginatedTickets" :key="ticket.id"
                  class="text-sm border-gray-700/25 border-b align-top hover:bg-gray-50 cursor-pointer"
                  @click="goToTicket(ticket.id)">
                  <td class="py-3 px-4 text-gray-700 font-medium">{{ ticket.reference_number }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ ticket.title }}</td>
                  <td class="py-3 px-4 text-gray-600 max-w-xs truncate">{{ ticket.description }}</td>
                  <td class="py-3 px-4 text-gray-700"><span class="uppercase">{{ ticket.department?.name || "-"
                      }}</span></td>
                  <td class="py-3 px-4 text-center">
                    <div>
                      <span :class="statusClass(ticket.status)" class="px-3 py-1 rounded-full text-sm ">
                        {{ utilStatusName(ticket.status) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-700">{{ formatDateDDMMYYYY(ticket.created_at) }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ ticket.assignee?.name || "-" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="mt-6 flex justify-between items-center">
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
        </div>
      </cardcontent>
    </card>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import cardtitle from '@/ui/cardtitle.vue';
import cardtitle2 from '@/ui/cardtitle2.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from 'vue-router';
import api from '@/api/axios-instance'; //Your configured axios instance
import { searchTickets, statusName as utilStatusName, formatDateDDMMYYYY as utilFormatDate, Ticket as UtilTicket } from '@/utils/ticketUtils';
import Swal from 'sweetalert2'; // Import SweetAlert2
import * as XLSX from 'xlsx'; // Import the xlsx library


const router = useRouter();
const auth = useAuthStore();

interface User {
  id: number;
  name: string;
  email?: string;
}

interface Department {
  id?: number;
  name: string;
}

interface Assignee {
  name: string;
}

interface TicketCreatorInfo {
  id: number;
  name: string;
  email?: string;
}

interface Ticket extends UtilTicket { // สามารถ extends จาก UtilTicket ถ้าโครงสร้างส่วนใหญ่เหมือนกัน
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  contact: string;
  created_at: string;
  updated_at: string;
  department?: Department;
  assignee?: Assignee;
  user?: TicketCreatorInfo; // The user object (name, email) from API - ตรงกับ user ใน UtilTicket
  ticket_types?: { name: string; }; 
  // files?: Array<{ id: number; filename: string; filepath: string; }>; // Uncomment if needed
}

const allFetchedTickets = ref<Ticket[]>([]);
const isLoading = ref(true);
const searchQuery = ref(''); // เพิ่ม ref สำหรับคำค้นหา
const perPage = ref(10);
const currentPage = ref(1);
const statusFilter = ref<'total' | 'open' | 'in_progress' | 'pending' | 'closed'>('total');
const sortDirection = ref<'asc' | 'desc' | null>(null); // null: unsorted, 'asc': oldest first, 'desc': newest first

const isStatusFilterDropdownOpenMyTickets = ref(false);
const statusFilterDropdownMyTicketsRef = ref<HTMLElement | null>(null);

const officerCreatedTickets = computed(() => {
  if (!auth.user || typeof auth.user.id !== 'number') {
    // console.warn("OfficerMyTicketsPage: officerCreatedTickets - Auth user or ID invalid/missing.");
    return [];
  }
  const officerId = auth.user.id;
  if (allFetchedTickets.value.length === 0) {
    return [];
  }

  // Filter tickets where the creator's ID matches the logged-in officer's ID
  const filtered = allFetchedTickets.value.filter(ticket => {
    // Use ticket.user.id for filtering, as the API provides the user object with an ID.
    // Ensure ticket.user and ticket.user.id exist before comparing.
    const ticketCreatorId = ticket.user?.id;

    if (ticket.user === undefined || ticket.user.id === undefined) {
      // console.warn(`OfficerMyTicketsPage: officerCreatedTickets - Ticket ID ${ticket.id} has undefined user or user.id. Skipping.`);
      return false;
    }
    // Ensure comparison is robust, e.g. if one is string and other is number
    return String(ticketCreatorId) === String(officerId);
  });
  return filtered;
});

const filteredAndSearchedTickets = computed(() => {
  let tickets = officerCreatedTickets.value;

  // Apply text search
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    tickets = searchTickets(tickets, searchQuery.value);
  }

  // Apply status filter
  if (statusFilter.value !== 'total') {
    tickets = tickets.filter(ticket => ticket.status === statusFilter.value);
  }

  // Apply sorting
  if (sortDirection.value) {
    // สร้างสำเนาของ array tickets ก่อนทำการเรียงลำดับ
    // เพื่อป้องกันการแก้ไข array เดิมโดยไม่ตั้งใจ และเพื่อให้การทำงานชัดเจนขึ้น
    const ticketsToSort = [...tickets];

    ticketsToSort.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);

      const timeA = dateA.getTime();
      const timeB = dateB.getTime();

      // จัดการกรณีที่วันที่อาจจะไม่ถูกต้อง (ทำให้ getTime() คืนค่า NaN)
      if (isNaN(timeA) && isNaN(timeB)) return 0; // ถ้าทั้งคู่ไม่ถูกต้อง ให้ถือว่าเท่ากัน
      if (isNaN(timeA)) return 1;  // ถ้า dateA ไม่ถูกต้อง ให้ไปอยู่ท้าย (สำหรับ 'asc' หมายถึง มากกว่า)
      if (isNaN(timeB)) return -1; // ถ้า dateB ไม่ถูกต้อง ให้ไปอยู่ท้าย (สำหรับ 'asc' หมายถึง น้อยกว่า)

      return sortDirection.value === 'asc' ? timeA - timeB : timeB - timeA;
    });
    return ticketsToSort; // คืนค่า array ที่เรียงลำดับแล้ว (สำเนา)
  }

  // ถ้าไม่ได้กำหนด sortDirection ให้คืนค่า tickets ที่ผ่านการกรองอื่นๆ มาแล้ว
  return tickets; 
});

const totalPages = computed(() => {
  if (perPage.value <= 0) return 1; // Avoid division by zero or negative
  return Math.ceil(filteredAndSearchedTickets.value.length / perPage.value);
});

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredAndSearchedTickets.value.slice(start, end);
});



const fetchOfficerTickets = async () => {
  // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Starting.");
  isLoading.value = true;
  if (!auth.accessToken) {
    isLoading.value = false;
    return;
  }
  // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Logged in Officer ID from auth store:", auth.user?.id, "Role:", auth.user?.role);

  try {
    const response = await api.get('/tickets', {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    allFetchedTickets.value = response.data as Ticket[];
    // console.log(`OfficerMyTicketsPage: fetchOfficerTickets - Fetched ${allFetchedTickets.value.length} tickets in total and assigned to allFetchedTickets.`);
  } catch (err) {
    console.error("OfficerMyTicketsPage: fetchOfficerTickets - Failed to load tickets.", err);
    //Consider adding user-facing error notification here
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // console.log("OfficerMyTicketsPage: onMounted - Component mounted.");
  const initFetch = () => {
    if (auth.user && typeof auth.user.id === 'number' && auth.user.role === 'OFFICER' || auth.user.role === 'USER') {
      // console.log("OfficerMyTicketsPage: initFetch - Conditions met, calling fetchOfficerTickets.", { userId: auth.user.id, role: auth.user.role });
      fetchOfficerTickets();
    } else {
      // console.warn("OfficerMyTicketsPage: initFetch - Conditions NOT met for fetching.");
    }
  };

  if (auth.user && typeof auth.user.id === 'number') {
    // console.log("OfficerMyTicketsPage: onMounted - Initial user data seems present, calling initFetch.");
    initFetch();
  } else {
    //Subscribe to auth store changes in case user info is loaded asynchronously
    const unsubscribe = auth.$subscribe((_mutation, state) => {
      if (state.user && typeof state.user.id === 'number' && state.user.role === 'OFFICER' || state.user.role === 'USER') { //Added role check here too for clarity
        initFetch();
        unsubscribe(); //Unsubscribe after successful fetch trigger
      }
    });
  }
  document.addEventListener('click', handleClickOutsideStatusFilterMyTickets);
});

watch([searchQuery, perPage, statusFilter, sortDirection], () => {
  currentPage.value = 1;
});

watch(currentPage, (newPage) => {
  if (newPage < 1) {
    currentPage.value = 1;
  } else if (newPage > totalPages.value && totalPages.value > 0) { //totalPages can be 0 if no tickets
    currentPage.value = totalPages.value;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideStatusFilterMyTickets);
});


const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const statusClass = (status: Ticket['status']): object => ({
  'bg-blue-100 text-blue-700': status === 'open',
  'bg-green-100 text-green-700': status === 'in_progress',
  'bg-purple-100 text-purple-700': status === 'pending',
  'bg-red-100 text-red-700': status === 'closed',
});

const formatDateDDMMYYYY = (dateString: string | Date): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const goToTicket = (id: number) => {
  router.push(`/tickets/${id}`);
};

const toggleStatusFilterDropdownMyTickets = () => {
  isStatusFilterDropdownOpenMyTickets.value = !isStatusFilterDropdownOpenMyTickets.value;
};

const selectStatusFilterMyTickets = (selectedStatusValue: 'total' | 'open' | 'in_progress' | 'pending' | 'closed') => {
  statusFilter.value = selectedStatusValue;
  isStatusFilterDropdownOpenMyTickets.value = false;
};

const handleClickOutsideStatusFilterMyTickets = (event: MouseEvent) => {
  if (statusFilterDropdownMyTicketsRef.value && !statusFilterDropdownMyTicketsRef.value.contains(event.target as Node)) {
    isStatusFilterDropdownOpenMyTickets.value = false;
  }
};
const resetFilters = () => {
  searchQuery.value = '' // ล้างการค้นหา
  statusFilter.value = 'total' // กลับไปแสดงทั้งหมด
  perPage.value = 10 // รีเซ็ตเป็นค่าเริ่มต้น

  // ถ้ามีตัวกรองอื่นๆ สามารถเพิ่มได้ที่นี่
  // dateFilter.value = null
  // categoryFilter.value = 'all'
}

const toggleSortDirection = () => {
  if (sortDirection.value === null) {
    sortDirection.value = 'desc'; // Default to newest first
  } else if (sortDirection.value === 'desc') {
    sortDirection.value = 'asc'; // Then oldest first
  } else {
    sortDirection.value = null; // Then unsorted (or back to default API order)
  }
};

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

const exportToExcel = async () => {
  if (!filteredAndSearchedTickets.value || filteredAndSearchedTickets.value.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ไม่มีข้อมูล',
      text: 'ไม่พบข้อมูลตั๋วตามเงื่อนไขปัจจุบันสำหรับ Export',
    });
    return;
  }

  const result = await Swal.fire({
    title: 'ยืนยันการ Export?',
    text: `คุณต้องการ Export ข้อมูลตั๋วจำนวน ${filteredAndSearchedTickets.value.length} รายการเป็นไฟล์ Excel หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, Export เลย!',
    cancelButtonText: 'ยกเลิก'
  });


  // Map data to a simpler structure for Excel, customize as needed
  const dataToExport = filteredAndSearchedTickets.value.map(ticket => ({
    'เลขอ้างอิง': ticket.reference_number,
    'หัวข้อ': ticket.title,
    'รายละเอียด': ticket.description,
    'แผนก': ticket.department?.name || "-",
    'หมวดหมู่': ticket.ticket_types?.name || "-",
    'ความสำคัญ': ticket.priority || "-",
    'สถานะ': statusName(ticket.status), // Use the existing statusName function
    'ผู้แจ้ง': ticket.user?.name || "-",
    'ติดต่อ': ticket.contact || "-",
    'วันที่สร้าง': formatDateDDMMYYYY(ticket.created_at), // Use the existing formatDate function
    'ผู้รับผิดชอบ': ticket.assignee?.name || "-",
    'หมายเหตุ': ticket.comment || "-",
  }));

  // Create a new workbook and a new worksheet
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายการแจ้งปัญหา"); // "รายการแจ้งปัญหา" is the sheet name

  // Generate a filename (e.g., tickets_YYYY-MM-DD.xlsx)
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const fileName = `my_tickets_export_${dateStr}.xlsx`;

  // Trigger the download
  XLSX.writeFile(wb, fileName);

  Swal.fire({
    icon: 'success',
    title: 'Export สำเร็จ!',
    text: `ไฟล์ ${fileName} ได้ถูกดาวน์โหลดเรียบร้อยแล้ว`,
  });
};
</script>

<style scoped>
/* Add any specific styles if needed */
.max-w-xs {
  max-width: 20rem;
  /* Adjust as needed for description column width */
}
</style>