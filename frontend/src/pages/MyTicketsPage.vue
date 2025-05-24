<template>
  <AppLayout>
    <cardtitle2>
      <div class="flex items-center justify-between mb-4">
    <p class="text-sm text-gray-600 font-medium">
      ปัญหาที่ฉันสร้างทั้งหมด: 
      <span class="text-blue-600 font-semibold">{{ officerCreatedTickets.length }}</span> 
      (แสดงผล: 
      <span class="text-blue-600 font-semibold">{{ filteredAndSearchedTickets.length }}</span>)
    </p>
    
    <!-- ปุ่มแสดงรายการต่อหน้า -->
    <div class="flex items-center space-x-2">
      <label for="perPageInput" class="text-sm text-gray-600">แสดง:</label>
      <input 
        id="perPageInput" 
        type="number" 
        min="1" 
        v-model.number="perPage" 
        class="w-20 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
      <span class="text-sm text-gray-600">รายการต่อหน้า</span>
    </div>
  </div>

  <!-- ส่วนค้นหาและกรอง -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- ช่องค้นหา -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input 
        type="text" 
        v-model="searchQuery" 
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" 
        placeholder="ค้นหาหัวข้อ, เลขอ้างอิง, สถานะ..."
      />
    </div>

    <!-- Dropdown กรองสถานะ -->
    <div class="relative">
      <select 
        v-model="statusFilter" 
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
      >
        <option value="total">ทั้งหมด</option>
        <option value="open">ใหม่</option>
        <option value="in_progress">กำลังดำเนินการ</option>
        <option value="closed">เสร็จสิ้น</option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- ปุ่มรีเซ็ต (เพิ่มเข้ามาเพื่อความสะดวก) -->
    <button 
      @click="resetFilters"
      class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      รีเซ็ตการกรอง
    </button>
  </div>
    </cardtitle2>
    <card>
      <cardcontent>
        <cardtitle>รายการแจ้งปัญหาของฉัน</cardtitle>
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
                  <th class="text-left py-3 px-4 font-medium text-gray-700">วันที่สร้าง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">ชื่อผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in paginatedTickets" :key="ticket.id"
                  class="border-b align-top hover:bg-gray-50 cursor-pointer" @click="goToTicket(ticket.id)">
                  <td class="py-3 px-4 text-gray-700">{{ ticket.reference_number }}</td>
                  <td class="py-3 px-4 text-gray-700 font-medium">{{ ticket.title }}</td>
                  <td class="py-3 px-4 text-gray-600 max-w-xs truncate">{{ ticket.description }}</td>
                  <td class="py-3 px-4 text-gray-700"><span class="uppercase">{{ ticket.department?.name || "-" }}</span></td>
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
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <span class="text-sm text-gray-700">
              หน้า {{ currentPage }} จาก {{ totalPages }}
            </span>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
import { ref, onMounted, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from 'vue-router';
import api from '@/api/axios-instance'; //Your configured axios instance
import { searchTickets, statusName as utilStatusName, formatDateDDMMYYYY as utilFormatDate, Ticket as UtilTicket } from '@/utils/ticketUtils';


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
  created_at: string;
  updated_at: string;
  department?: Department;
  assignee?: Assignee;
  user?: TicketCreatorInfo; // The user object (name, email) from API - ตรงกับ user ใน UtilTicket
  // ticket_types?: { name: string; }; // Uncomment if needed
  // files?: Array<{ id: number; filename: string; filepath: string; }>; // Uncomment if needed
}

const allFetchedTickets = ref<Ticket[]>([]);
const isLoading = ref(true);
const searchQuery = ref(''); // เพิ่ม ref สำหรับคำค้นหา
const perPage = ref(10);
const currentPage = ref(1);
const statusFilter = ref<'total' | 'open' | 'in_progress' | 'pending' | 'closed'>('total');

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
});

watch([searchQuery, perPage, statusFilter], () => {
  currentPage.value = 1;
});

watch(currentPage, (newPage) => {
  if (newPage < 1) {
    currentPage.value = 1;
  } else if (newPage > totalPages.value && totalPages.value > 0) { //totalPages can be 0 if no tickets
    currentPage.value = totalPages.value;
  }
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

const resetFilters = () => {
  searchQuery.value = '' // ล้างการค้นหา
  statusFilter.value = 'total' // กลับไปแสดงทั้งหมด
  perPage.value = 10 // รีเซ็ตเป็นค่าเริ่มต้น
  
  // ถ้ามีตัวกรองอื่นๆ สามารถเพิ่มได้ที่นี่
  // dateFilter.value = null
  // categoryFilter.value = 'all'
}
</script>

<style scoped>
/* Add any specific styles if needed */
.max-w-xs {
  max-width: 20rem;
  /* Adjust as needed for description column width */
}
</style>