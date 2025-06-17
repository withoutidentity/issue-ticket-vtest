<template>
  <div v-if="visible"
    class="fixed inset-0 backdrop-blur-sm bg-black/60 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out"
    :class="{ 'opacity-100': visible, 'opacity-0': !visible }">
    <div
      class="relative mx-auto border w-full max-w-5xl shadow-xl rounded-xl bg-white transform transition-all duration-300 ease-in-out"
      :class="{ 'scale-100 opacity-100': visible, 'scale-95 opacity-0': !visible }">
      <div class="text-left">
        <div class="flex justify-between items-center bg-gray-100 px-6 py-4 rounded-t-xl border-b border-gray-500/25">
          <h3 class="text-xl leading-6 font-semibold text-gray-800">{{ modalTitle }}</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5">
          <!-- Search and Per Page -->
          <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
            <div class="relative w-full md:w-auto">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input type="text" v-model="modalSearchQuery"
                class="w-full md:w-72 pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="ค้นหาในรายการนี้..." />
            </div>
            <div class="flex items-center space-x-2 w-full md:w-auto justify-start md:justify-end">
              <label for="modalPerPageInput" class="text-sm text-gray-600">แสดง:</label>
              <input id="modalPerPageInput" type="number" min="1" v-model.number="modalPerPage"
                class="w-20 md:w-16 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
              <span class="text-sm text-gray-600">รายการ</span>
            </div>
          </div>

          <!-- Ticket Table -->
          <div class="rounded-lg overflow-hidden overflow-y-auto overflow-x-auto border border-gray-200 max-h-[60vh]">
            <table class="w-full min-w-[800px]">
              <thead class="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">เลขอ้างอิง</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">หัวข้อ</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">แผนก</th>
                  <th class="text-center py-3 px-4 font-semibold text-gray-700 text-sm">สถานะ</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ผู้แจ้ง</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">วันที่สร้าง</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody v-if="paginatedModalTickets.length > 0" class="bg-white">
                <tr v-for="ticket in paginatedModalTickets" :key="ticket.id"
                  class="text-sm border-b border-gray-700/25 align-top hover:bg-gray-50"
                  @click="goToTicket(ticket.id)" style="cursor: pointer;" >
                  <td class="py-2.5 px-4 text-gray-700 whitespace-nowrap">{{ ticket.reference_number }}</td>
                  <td class="py-2.5 px-4 text-gray-700 font-medium max-w-xs truncate">{{ ticket.title }}</td>
                  <td class="py-2.5 px-4 text-gray-700 whitespace-nowrap">
                    <span class="uppercase">{{ ticket.department?.name || "-" }}</span>
                  </td>
                  <td class="py-2.5 px-4 text-center whitespace-nowrap">
                    <span :class="{
                      'bg-blue-100 text-blue-700': ticket.status === 'open',
                      'bg-orange-100 text-orange-700': ticket.status === 'in_progress',
                      'bg-purple-100 text-purple-700': ticket.status === 'pending',
                      'bg-green-100 text-green-700': ticket.status === 'closed',
                    }" class="px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ statusName(ticket.status) }}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-gray-700 whitespace-nowrap">{{ ticket.user?.name || "-" }}</td>
                  <td class="py-2.5 px-4 text-gray-700 whitespace-nowrap">{{ formatDateDDMMYYYY(ticket.created_at) }}
                  </td>
                  <td class="py-2.5 px-4 text-gray-700 whitespace-nowrap">{{ ticket.assignee?.name || "-" }}</td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="7" class="text-center py-10 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      aria-hidden="true">
                      <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูล</h3>
                    <p class="mt-1 text-sm text-gray-500">ไม่พบรายการแจ้งปัญหาตามเงื่อนไขที่เลือก</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="modalTotalPages > 0 && filteredAndSearchedModalTickets.length > 0"
            class="mt-5 flex flex-col md:flex-row justify-between items-center gap-3">
            <div class="text-sm text-gray-700 w-full md:w-auto text-center md:text-left">
              แสดง {{ (modalCurrentPage - 1) * modalPerPage + 1 }} ถึง {{ Math.min(modalCurrentPage * modalPerPage,
              filteredAndSearchedModalTickets.length) }} จากทั้งหมด {{ filteredAndSearchedModalTickets.length }} รายการ
            </div>
            <div class="flex items-center w-full md:w-auto justify-center" v-if="modalTotalPages > 1">
              <button @click="prevModalPage" :disabled="modalCurrentPage === 1"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                ก่อนหน้า
              </button>
              <span class="px-3 py-1.5 text-sm text-gray-700 border-t border-b border-gray-300 bg-white">
                หน้า {{ modalCurrentPage }} / {{ modalTotalPages }}
              </span>
              <button @click="nextModalPage" :disabled="modalCurrentPage === modalTotalPages"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                ถัดไป
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end items-center px-6 py-4 bg-gray-50 rounded-b-xl border-t space-x-3">
          <button @click="exportModalDataToExcel"
            class="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button @click="$emit('close')"
            class="px-4 py-2 bg-gray-200 text-gray-700 text-base font-medium rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
            ปิด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, PropType } from 'vue';
import { Ticket as UtilTicket, statusName as utilStatusName, formatDateDDMMYYYY as utilFormatDate, searchTickets } from '@/utils/ticketUtils';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  visible: Boolean,
  tickets: {
    type: Array as PropType<UtilTicket[]>,
    default: () => []
  },
  statusTitle: {
    type: String,
    default: 'รายการแจ้งปัญหา'
  }
});

const emit = defineEmits(['close']);

const modalSearchQuery = ref('');
const modalPerPage = ref(10);
const modalCurrentPage = ref(1);
const sortDirection = ref<'asc' | 'desc' | null>('desc'); 

const modalTitle = computed(() => `รายการแจ้งปัญหา: ${props.statusTitle}`);

const goToTicket = (id: number) => {
  router.push(`/tickets/${id}`);
};

const filteredAndSearchedModalTickets = computed(() => {
  let processed = [...props.tickets];
  if (modalSearchQuery.value && modalSearchQuery.value.trim() !== '') {
    processed = searchTickets(processed, modalSearchQuery.value);
  }
  // เพิ่มการเรียงลำดับตามวันที่
  processed.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // เรียงจากใหม่ไปเก่า
  });
  return processed;
});

const modalTotalPages = computed(() => {
  if (modalPerPage.value <= 0) return 0;
  return Math.ceil(filteredAndSearchedModalTickets.value.length / modalPerPage.value);
});

const paginatedModalTickets = computed(() => {
  if (modalTotalPages.value === 0) return [];
  const start = (modalCurrentPage.value - 1) * modalPerPage.value;
  const end = start + modalPerPage.value;
  return filteredAndSearchedModalTickets.value.slice(start, end);
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    modalCurrentPage.value = 1;
    modalSearchQuery.value = '';
    // Reset perPage if you want it to be consistent every time modal opens
    // modalPerPage.value = 10;
  }
});

watch([modalSearchQuery, modalPerPage], () => {
  modalCurrentPage.value = 1;
});

const prevModalPage = () => { if (modalCurrentPage.value > 1) modalCurrentPage.value--; };
const nextModalPage = () => { if (modalCurrentPage.value < modalTotalPages.value) modalCurrentPage.value++; };

const exportModalDataToExcel = async () => {
  if (!filteredAndSearchedModalTickets.value || filteredAndSearchedModalTickets.value.length === 0) {
    Swal.fire('ไม่มีข้อมูล', 'ไม่พบข้อมูลสำหรับ Export ใน Modal นี้', 'info');
    return;
  }

  const result = await Swal.fire({
    title: 'ยืนยันการ Export?',
    text: `คุณต้องการ Export ข้อมูลตั๋วจำนวน ${filteredAndSearchedModalTickets.value.length} รายการเป็นไฟล์ Excel หรือไม่?`,
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

  const dataToExport = filteredAndSearchedModalTickets.value.map(ticket => ({
    'เลขอ้างอิง': ticket.reference_number,
    'หัวข้อ': ticket.title,
    'รายละเอียด': ticket.description,
    'แผนก': ticket.department?.name || "-",
    'หมวดหมู่': ticket.ticket_types?.name || "-",
    'ความสำคัญ': ticket.priority || "-",
    'สถานะ': utilStatusName(ticket.status),
    'ผู้แจ้ง': ticket.user?.name || "-",
    'ติดต่อ': ticket.contact || "-",
    'วันที่สร้าง': utilFormatDate(ticket.created_at),
    'ผู้รับผิดชอบ': ticket.assignee?.name || "-",
    'หมายเหตุ': ticket.comment || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  const sheetName = `Tickets_${props.statusTitle}`.substring(0, 30); // Ensure sheet name is valid
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const fileName = `tickets_summary_${props.statusTitle}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  Swal.fire('Export สำเร็จ!', `ไฟล์ ${fileName} ได้ถูกดาวน์โหลดเรียบร้อยแล้ว`, 'success');
};

const statusName = utilStatusName;
const formatDateDDMMYYYY = utilFormatDate;

</script>

<style scoped>
/* For smooth transition */
.transition-opacity {
  transition-property: opacity;
}

.transition-transform {
  transition-property: transform;
}
</style>
