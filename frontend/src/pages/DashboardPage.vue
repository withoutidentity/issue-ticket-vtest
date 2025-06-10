<template>
  <AppLayout>
    <card>
      <cardcontent>
        <!-- <cardtitle>Dashboard</cardtitle> -->
        <div class="space-y-6 overflow-y-auto truncate">
          <AdminDashboard v-if="auth.user.role === 'ADMIN' || auth.user.role === 'OFFICER'"
            @filter-status-changed="handleStatusFilterChange" @filter-type-changed="handleTypeFilterChange"
            @filter-creation-date-changed="handleCreationDateFilterChange"
            @filter-department-changed="handleDepartmentFilterChange" />
        </div>
      </cardcontent>
    </card>

    <card>
      <cardcontent>
        <div class="space-y-6">
          <div class="flex flex-col space-y-4 mb-4">
            <!-- Title Row -->
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <cardtitle class="text-lg font-semibold mb-3 sm:mb-0">รายการแจ้งปัญหา</cardtitle>

              <!-- Per Page Control - Show on mobile after title -->
              <div class="flex items-center space-x-2 sm:hidden">
                <label for="perPageMobileInput" class="text-sm text-gray-600">แสดง:</label>
                <input id="perPageMobileInput" type="number" min="1" v-model.number="perPage"
                  class="w-16 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                <span class="text-sm text-gray-600">รายการต่อหน้า</span>
              </div>
            </div>

            <!-- Controls Row -->
            <div class="flex flex-col space-y-3 sm:flex-wrap sm:justify-between sm:gap-y-3 sm:space-y-0 md:flex-wrap md:gap-y-3">
              <!-- Left side: Search, Filter, Reset -->
              <div class="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <!-- Search box -->
                <div class="relative w-full sm:w-auto">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input type="text" v-model="searchQuery"
                    class="w-full sm:w-56 md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-all duration-200"
                    placeholder="ค้นหาหัวข้อ, เลขอ้างอิง, ชื่อผู้แจ้ง..." />
                </div>

                <!-- Filter and Reset buttons container -->
                <div class="flex space-x-3">
                  <!-- Filter button -->
                  <div class="relative" ref="filterDropdownRef">
                    <button @click="toggleFilterDropdown"
                      class="h-10 w-10 flex items-center justify-center border border-gray-300 cursor-pointer rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                      <!-- Filter Icon -->
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-1.414.914l-2-1A1 1 0 0110 19.414V13.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                    <!-- Dropdown List -->
                    <div v-if="isFilterDropdownOpen"
                      class="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 left-0 sm:right-0 sm:left-auto max-h-80 overflow-y-auto">
                      <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">กรองตามสถานะ</div>
                      <ul class="pb-1 border-b border-gray-200">
                        <li @click="applyFilter('status', null)"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          ทั้งหมด
                        </li>
                        <li @click="applyFilter('status', 'open')"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          ใหม่
                        </li>
                        <li @click="applyFilter('status', 'in_progress')"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          กำลังดำเนินการ
                        </li>
                        <li @click="applyFilter('status', 'closed')"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          เสร็จสิ้น
                        </li>
                      </ul>
                      <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase mt-1">กรองตามแผนก</div>
                      <ul class="py-1">
                        <li @click="applyFilter('department', null)"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          ทั้งหมด (แผนก)
                        </li>
                        <li v-if="departmentsList.length === 0 && !loadingDepartments"
                          class="px-4 py-2 text-sm text-gray-400">ไม่มีข้อมูลแผนก</li>
                        <li v-if="loadingDepartments" class="px-4 py-2 text-sm text-gray-400">กำลังโหลดแผนก...</li>
                        <li v-for="dept in departmentsList" :key="dept.id" @click="applyFilter('department', dept.name)"
                          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer uppercase">
                          {{ dept.name }}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <!-- Reset button -->
                  <button @click="resetFilters" ref="resetButtonRef"
                    class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg cursor-pointer shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Right side: Export and Per Page (hidden on mobile) -->
              <div class="flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-3 sm:space-x-3">
                <!-- Export to Excel button -->
                <button @click="exportToExcel"
                  class="h-10 px-4 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-600" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span class="hidden xs:inline">Export Excel</span>
                  <span class="xs:hidden">Export</span>
                </button>

                <!-- Per Page control (hidden on mobile) -->
                <div class="hidden sm:flex items-center space-x-2">
                  <label for="perPageDesktopInput" class="text-sm text-gray-600 whitespace-nowrap">แสดง:</label>
                  <input id="perPageDesktopInput" type="number" min="1" v-model.number="perPage"
                    class="w-16 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                  <span class="text-sm text-gray-600 whitespace-nowrap">รายการต่อหน้า</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 rounded-lg overflow-hidden overflow-x-auto border border-gray-200">
            <!-- Ticket Table -->
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[80px]">
                    เลขอ้างอ้างอิง</th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[120px]">
                    หัวข้อ</th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm hidden sm:table-cell min-w-[150px]">
                    คำอธิบาย</th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm hidden md:table-cell min-w-[100px]">
                    แผนก</th>
                  <th
                    class="text-center py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[150px]">
                    สถานะ</th>
                  <th class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[100px]">
                    ผู้แจ้ง</th>
                  <th @click="toggleSortDirectionDashboard"
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors duration-150 text-xs sm:text-sm min-w-[100px]">
                    <div class="flex items-center">
                      <span>วันที่สร้าง</span>
                      <svg v-if="sortDirectionDashboard === 'asc'" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                      <svg v-if="sortDirectionDashboard === 'desc'" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      <svg v-if="!sortDirectionDashboard" xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 ml-1 text-gray-400 opacity-50" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th
                    class="text-left py-2 px-2 sm:py-3 sm:px-3 font-medium text-gray-700 text-xs sm:text-sm min-w-[120px]">
                    ชื่อผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in paginatedTickets" :key="ticket.id"
                  class="text-sm border-gray-700/25 border-b align-top hover:bg-gray-50 cursor-pointer"
                  @click="goToTicket(ticket.id)">
                  <td class="py-3 px-4 text-gray-700">{{ ticket.reference_number }}</td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-700 font-medium break-words">{{ ticket.title }}</td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-600 hidden sm:table-cell break-words">{{
                    ticket.description }}</td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-700 hidden md:table-cell break-words">
                    <span class="uppercase">{{ ticket.department?.name || "-" }}</span>
                  </td>
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-center">
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
                  <td class="py-2 px-2 sm:py-3 sm:px-3 text-gray-700 break-words">
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
import AdminDashboard from "./AdminDashboard.vue"; // AdminDashboard is now used for both
import { searchTickets, statusName as utilStatusName, formatDateDDMMYYYY as utilFormatDate, Ticket as UtilTicket } from '@/utils/ticketUtils';

import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useTicketStore } from "@/stores/ticketStore"; // Import ticket store
import { config } from "@/config";
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'; // Import the xlsx library
import Swal from 'sweetalert2'; // Import SweetAlert2
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
const creationDateFilterForTable = ref<CreationDateFilter | null>(null);
const sortDirectionDashboard = ref<'asc' | 'desc' | null>(null); // For DashboardPage sorting

const isFilterDropdownOpen = ref(false);
const filterDropdownRef = ref<HTMLElement | null>(null); // Ref for the dropdown element
const resetButtonRef = ref<HTMLButtonElement | null>(null); // Ref for the reset button

interface Department {
  id: number;
  name: string;
}
const departmentsList = ref<Department[]>([]);
const loadingDepartments = ref(false);

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
  }
};

const handleDepartmentFilterChange = (newDepartment: string | null) => {
  departmentFilterForTable.value = newDepartment;
  if (newDepartment) {
    statusFilterForTable.value = null;
    typeFilterForTable.value = null;
    creationDateFilterForTable.value = null;
  }
};

const handleCreationDateFilterChange = (newCreationDateFilter: CreationDateFilter | null) => {
  creationDateFilterForTable.value = newCreationDateFilter;
  if (newCreationDateFilter) { // If a creation date filter is applied, clear other filters
    statusFilterForTable.value = null;
    typeFilterForTable.value = null;
    departmentFilterForTable.value = null;
  }
};

const filteredTableTickets = computed((): ticket[] => { // กำหนด type การคืนค่าให้ชัดเจน
  // เริ่มต้นด้วย type UtilTicket[] จาก store
  let processingTickets: UtilTicket[] = [...ticketStore.tickets];

  // 1. REMOVED: Officer's department filter. Now ADMIN and OFFICER see all tickets by default,
  //    subject to filters from AdminDashboard component.
  // if (auth.user?.role === 'OFFICER') {
  //   const officerDepartmentId = auth.user?.department?.id;
  //   if (officerDepartmentId !== undefined && officerDepartmentId !== null) {
  //     processingTickets = processingTickets.filter(ticket => ticket.department?.id === officerDepartmentId);
  //   } else {
  //     processingTickets = []; // If officer has no department, they see no tickets.
  //   }
  // }

  // 2. Apply active filter from AdminDashboard or OfficerDashboard events
  //    The handle... functions ensure that only one of these high-level filters is active at a time
  //    by clearing others. For example, handleTypeFilterChange clears statusFilterForTable.
  // processingTickets ยังคงเป็น UtilTicket[] ตลอดการกรองเหล่านี้

  // Filters from AdminDashboard (now used by both ADMIN and OFFICER)
  // Note: statusFilterForTable is also v-model for the local dropdown.
  // If typeFilter, departmentFilter, or creationDateFilter are set by AdminDashboard,
  // their respective handle... functions will clear statusFilterForTable.

  if (typeFilterForTable.value) {
    processingTickets = processingTickets.filter(t => t.ticket_types?.name === typeFilterForTable.value);
  }
  // Apply department filter if it's active.
  // This filter is set by AdminDashboard, which is visible to both ADMIN and OFFICER.
  else if (departmentFilterForTable.value) {
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

  // 4. Apply sorting
  if (sortDirectionDashboard.value) {
    searchedResult.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDirectionDashboard.value === 'asc' ? dateA - dateB : dateB - dateA;
    });
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
  fetchDepartmentsList();
  // Add event listener for clicks outside the status filter dropdown
  document.addEventListener('click', handleClickOutsideFilterDropdown);
});

onUnmounted(() => {
  // Remove event listener when component is unmounted
  document.removeEventListener('click', handleClickOutsideFilterDropdown);
});

const fetchDepartmentsList = async () => {
  loadingDepartments.value = true;
  try {
    const res = await api.get(`/departments`);
    departmentsList.value = res.data as Department[];
  } catch (error) {
    console.error('Failed to fetch departments list for filter dropdown:', error);
    // Optionally, show an error to the user or set departmentsList to an empty array
  } finally {
    loadingDepartments.value = false;
  }
};

const toggleFilterDropdown = () => {
  isFilterDropdownOpen.value = !isFilterDropdownOpen.value;
};

const applyFilter = (filterType: 'status' | 'department', value: string | null) => {
  if (filterType === 'status') {
    // Directly call handleStatusFilterChange to ensure consistent logic
    // (like clearing other AdminDashboard filters if a status is explicitly chosen here)
    handleStatusFilterChange(value as 'open' | 'in_progress' | 'pending' | 'closed' | null);
    // If a status is chosen from this dropdown, ensure department filter from AdminDashboard is cleared
    // This might be redundant if handleStatusFilterChange already does this, but good for clarity
    if (value !== null) {
      departmentFilterForTable.value = null;
    }
  } else if (filterType === 'department') {
    // Directly call handleDepartmentFilterChange
    handleDepartmentFilterChange(value);
    // If a department is chosen from this dropdown, ensure status filter from AdminDashboard is cleared
    if (value !== null) {
      statusFilterForTable.value = null;
    }
  }
  isFilterDropdownOpen.value = false;
};

const handleClickOutsideFilterDropdown = (event: MouseEvent) => {
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(event.target as Node)) {
    isFilterDropdownOpen.value = false;
  }
};

watch([searchQuery, perPage, statusFilterForTable, typeFilterForTable, departmentFilterForTable, creationDateFilterForTable, sortDirectionDashboard], () => {
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

  // Note: The handle... functions already clear other related filters when one is set.
  // This reset ensures everything goes back to default.

  // Remove focus from the reset button
  resetButtonRef.value?.blur();
}

const toggleSortDirectionDashboard = () => {
  if (sortDirectionDashboard.value === null) {
    sortDirectionDashboard.value = 'desc'; // Default to newest first
  } else if (sortDirectionDashboard.value === 'desc') {
    sortDirectionDashboard.value = 'asc'; // Then oldest first
  } else {
    sortDirectionDashboard.value = null; // Then unsorted
  }
};


const exportToExcel = async () => { // Changed to async to await Swal
  if (!filteredTableTickets.value || filteredTableTickets.value.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ไม่มีข้อมูล',
      text: 'ไม่พบข้อมูลตั๋วตามเงื่อนไขปัจจุบันสำหรับ Export',
    });
    return;
  }

  // Add confirmation step
  const result = await Swal.fire({
    title: 'ยืนยันการ Export?',
    text: `คุณต้องการ Export ข้อมูลตั๋วจำนวน ${filteredTableTickets.value.length} รายการเป็นไฟล์ Excel หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ใช่, Export เลย!',
    cancelButtonText: 'ยกเลิก'
  });

  if (!result.isConfirmed) {
    return; // User cancelled
  }

  const dataToExport = filteredTableTickets.value.map(ticket => ({
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
  const fileName = `tickets_export_${dateStr}.xlsx`;

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
/* Custom breakpoint for search/filter layout */
@media (max-width: 1120px) {
  .search-filter-controls {
    flex-direction: column;
    /* Stack items vertically */
    align-items: flex-start;
    /* Align items to the start */
  }
}
</style>