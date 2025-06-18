<template>
  <AppLayout>
    <card>
      <cardcontent>
        <cardtitle>Dashboard</cardtitle>
        <div class="space-y-6 overflow-y-auto truncate">
          <div class="p-6 w-full">
            <div class="grid lg:grid-cols-4 sm:grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-100 shadow p-4 rounded cursor-pointer hover:bg-gray-400"
                @click="filterByStatus('total')">
                <p class="text-gray-600">ทั้งหมด</p>
                <p class="text-3xl font-bold">{{ summary.total }}</p>
              </div>
              <div class="bg-red-100 shadow p-4 rounded cursor-pointer hover:bg-red-400"
                @click="filterByStatus('open')">
                <p class="text-gray-600">ใหม่</p>
                <p class="text-3xl font-bold">{{ summary.open }}</p>
              </div>
              <div class="bg-yellow-100 shadow p-4 rounded cursor-pointer hover:bg-yellow-400"
                @click="filterByStatus('in_progress')">
                <p class="text-gray-600">กำลังดำเนินการ</p>
                <p class="text-3xl font-bold">{{ summary.in_progress }}</p>
              </div>
              <div class="bg-green-100 shadow p-4 rounded cursor-pointer hover:bg-green-400"
                @click="filterByStatus('closed')">
                <p class="text-gray-600">ดำเนินการเสร็จ</p>
                <p class="text-3xl font-bold">{{ summary.closed }}</p>
              </div>
            </div>

            <div class="w-full shadow p-6 rounded grid xl:grid-cols-2 lg:grid-cols-1 gap-4 overflow-x-auto">
              <div class="bg-white shadow p-6 rounded">
                <h3 class="text-xl font-semibold mb-4 text-gray-700">Ticket ตามแผนก</h3>
                <div class="h-[350px] mb-6">
                  <!-- กราฟกลุ่มตามเดือน -->
                  <Bar :data="departmentChartData" :options="departmentChartOptions" :key="departmentChartKey" />
                </div>
              </div>
              <!-- New Ticket Creation Trend Chart -->
              <div class="bg-white shadow p-6 rounded">
                <TicketCreationTrendChart @filter-by-creation-date="handleCreationDateFilterChanged"
                  @bar-clicked="handleTicketCreationTrendBarClick" />
              </div>

            </div>
            <div class="bg-white shadow p-4 sm:p-6 mt-3 rounded overflow-x-auto">
              <div class="text-lg sm:text-xl font-semibold mb-4 text-gray-700 break-all">
                <span class="hidden sm:inline">แนวโน้ม Ticket ตามแผนก (รายวัน)</span>
                <span class="sm:hidden">แนวโน้ม Ticket ตามแผนก</span>
              </div>
              <div class="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div>
                  <label for="departmentTrendStartDate"
                    class="block text-sm font-medium text-gray-700">วันที่เริ่มต้น:</label>
                  <input type="date" id="departmentTrendStartDate" v-model="departmentTrendStartDate"
                    @change="updateDepartmentTrendChart"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                </div>
                <div>
                  <label for="departmentTrendEndDate"
                    class="block text-sm font-medium text-gray-700">วันที่สิ้นสุด:</label>
                  <input type="date" id="departmentTrendEndDate" v-model="departmentTrendEndDate"
                    @change="updateDepartmentTrendChart"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                </div>
              </div>
              <div class="h-[400px] min-w-[700px]">
                <Bar v-if="processedDepartmentTrendData.labels && processedDepartmentTrendData.labels.length > 0"
                  :data="processedDepartmentTrendData" :options="departmentTrendOptions" />
                <div v-else class="flex items-center justify-center h-full text-gray-500">
                  {{ (ticketStore.loading && !ticketStore.tickets.length) ? 'กำลังโหลดข้อมูล...' :
                    'กรุณาเลือกช่วงวันที่หรือไม่พบข้อมูลสำหรับช่วงที่เลือก' }}
                </div>
              </div>
            </div>
            <TicketSummaryModal :visible="isSummaryModalVisible" :tickets="ticketsForModal"
              :status-title="modalStatusTitle" @close="closeSummaryModal" />
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
import { ref, onMounted, computed, defineEmits, watch } from 'vue'
import { config } from '@/config';
import api from '@/api/axios-instance'

import { useTicketStore } from '@/stores/ticketStore'
import { useAuthStore } from "@/stores/auth";
import TicketCreationTrendChart from '@/components/TicketCreationTrendChart.vue'
import TicketSummaryModal from '@/components/TicketSummaryModal.vue';
import { departmentName as utilDepartmentName } from '@/utils/ticketUtils';

const auth = useAuthStore();

const emit = defineEmits(['filter-status-changed', 'filter-type-changed', 'filter-creation-date-changed', 'filter-department-changed'])

// interface ticket_types { //  This interface seems unused for status filtering logic
//   id: number
//   name: string
//   description: string
// }

// Define Period type, similar to the one in TicketCreationTrendChart
type Period = 'day' | 'month' | 'year';
interface CreationDateFilter {
  period: Period;
  value: string;
}

interface Department {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed'; // Removed null as status should always be one of these
  created_at: string;
  updated_at: string;
  department?: {
    id?: number;
    name: string;
  };
  assignee?: {
    name: string;
  };
  user?: { // คนที่สร้าง Ticket (ผู้แจ้ง)
    id: number;
    name: string;
    email?: string;
  };
  ticket_types?: { // ประเภทของ Ticket
    id?: number;
    name: string;
  };
  priority: 'low' | 'medium' | 'high'; // เพิ่ม priority
  contact: string; // เพิ่ม contact
  comment?: string; // เพิ่ม comment
  files?: Array<{ id: number; filename: string; filepath: string; }>; // เพิ่ม files
}


const statusFilter = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilter = ref<string | null>(null);
const departmentFilter = ref<string | null>(null); // For bar chart department filtering

const types = ref<{ id: number; name: string }[]>([]);
const creationDateFilter = ref<CreationDateFilter | null>(null);

const ticketStore = useTicketStore()

// For Summary Modal
const isSummaryModalVisible = ref(false);
const ticketsForModal = ref<Ticket[]>([]);
const modalStatusTitle = ref('');


import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  TimeSeriesScale, TooltipItem,
} from 'chart.js'
import type { ChartEvent, ActiveElement, Chart } from 'chart.js'; // Added for stronger typing


import 'chartjs-adapter-date-fns';
import { th } from 'date-fns/locale'; // For Thai date formatting if needed by adapter

ChartJS.register(Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, TimeSeriesScale)

// ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale) // Already registered above

interface TypeSummary {
  name: string
  count: number
}
interface DepartmentSummary {
  name: string
  count: number
}

function filterByStatus(statusToFilter: 'open' | 'in_progress' | 'pending' | 'closed' | 'total') {
  let title = '';
  let filteredTicketsForModal: Ticket[] = [];
  const allTicketsFromStore = ticketStore.tickets as Ticket[]; // Assuming ticketStore.tickets are of type Ticket or compatible

  if (statusToFilter === 'total') {
    statusFilter.value = null; // Set to null to show all tickets
    title = 'ทั้งหมด';
    filteredTicketsForModal = [...allTicketsFromStore];
  } else {
    statusFilter.value = statusToFilter; // Store the selected status
    title = statusToFilter === 'open' ? 'รอดำเนินการ' :
      statusToFilter === 'in_progress' ? 'กำลังดำเนินการ' :
        statusToFilter === 'closed' ? 'ดำเนินการเสร็จ' :
          statusToFilter === 'pending' ? 'รออะไหล่/การอนุมัติ' : ''; // Adjust if 'pending' is not a card status
    filteredTicketsForModal = allTicketsFromStore.filter(ticket => ticket.status === statusToFilter);
  }

  // Prepare data for the modal
  modalStatusTitle.value = title;
  ticketsForModal.value = filteredTicketsForModal;
  isSummaryModalVisible.value = true;

  // Clear other filters and emit for the main DashboardPage table
  typeFilter.value = null; // Clear type filter when status filter is applied
  departmentFilter.value = null; // Clear department filter
  creationDateFilter.value = null; // Clear creation date filter

  emit('filter-status-changed', statusFilter.value); // This updates DashboardPage
  emit('filter-department-changed', null);
  emit('filter-creation-date-changed', null); // Notify parent to clear creation date filter
  emit('filter-type-changed', null); // Notify parent to clear type filter
}

const fetchTypes = async () => {
  try {
    const res = await api.get(`/types`);
    types.value = res.data.data.map((type: any) => ({ id: type.id, name: type.name }));
  } catch (err) {
    console.error("Failed to load types", err);
  }
}

const typeName = computed(() => (typeId: number | "") => {
  if (!typeId) return null;
  const foundType = types.value.find(type => type.id === typeId);
  return foundType ? foundType.name : null;
});

function handleDepartmentChartClick(departmentName: string) {
  const allTicketsFromStore = ticketStore.tickets as Ticket[];

  if (departmentFilter.value === departmentName) {
    departmentFilter.value = null; // Toggle off if the same department is clicked again
    isSummaryModalVisible.value = false; // Close modal
  } else {
    departmentFilter.value = departmentName;

    // Filter tickets for the modal
    const filteredTicketsForModal = allTicketsFromStore.filter(
      ticket => ticket.department?.name === departmentName
    );

    // Prepare data for the modal
    // We can reuse modalStatusTitle, or create a new one like modalDepartmentTitle if preferred for clarity
    // For now, reusing modalStatusTitle for simplicity, the modal's title will be "รายการแจ้งปัญหา: [Department Name]"
    modalStatusTitle.value = utilDepartmentName(departmentName); // Use translated name for modal
    ticketsForModal.value = filteredTicketsForModal;
    isSummaryModalVisible.value = true;
  }

  // Clear other filters and emit for the main DashboardPage table
  statusFilter.value = null;
  creationDateFilter.value = null; // Clear creation date filter
  typeFilter.value = null;

  emit('filter-department-changed', departmentFilter.value);
  emit('filter-creation-date-changed', null); // Notify parent to clear creation date filter
  emit('filter-status-changed', null); // Notify parent to clear status filter
  emit('filter-type-changed', null);
}
const handleCreationDateFilterChanged = (filter: CreationDateFilter | null) => {
  // This function is kept for its original purpose of filtering the main list.
  // The modal display for this chart will be handled by handleTicketCreationTrendBarClick.
  creationDateFilter.value = filter;
  if (filter) {
    statusFilter.value = null;
    typeFilter.value = null;
    departmentFilter.value = null;
    // Notify parent if these filters are managed at a higher level
    emit('filter-status-changed', null);
    emit('filter-type-changed', null);
    emit('filter-department-changed', null);
  }
  emit('filter-creation-date-changed', filter); // Emit the creation date filter to parent
  // Note: The TicketCreationTrendChart itself will update its bar colors
  // because its internal selectedBarOriginalKey changes, triggering a re-render.
  // If other charts needed to clear their selection, they'd need similar logic or props.
};
function handleTicketCreationTrendBarClick(payload: { period: Period, value: string, displayLabel: string }) {
  const { period, value, displayLabel } = payload;
  const allTicketsFromStore = ticketStore.tickets as Ticket[];

  const filteredTicketsForModal = allTicketsFromStore.filter(ticket => {
    const createdAt = new Date(ticket.created_at);
    if (period === 'day') { // value is YYYY-MM-DD
      const ticketDateStr = createdAt.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return ticketDateStr === value;
    } else if (period === 'month') { // value is YYYY-MM
      const ticketMonthStr = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      return ticketMonthStr === value;
    } else if (period === 'year') { // value is YYYY
      const ticketYearStr = `${createdAt.getFullYear()}`;
      return ticketYearStr === value;
    }
    return false;
  });

  modalStatusTitle.value = `รายการแจ้งปัญหาที่สร้าง (${period}): ${displayLabel}`;
  ticketsForModal.value = filteredTicketsForModal;
  isSummaryModalVisible.value = true;

  // Update global filters to match behavior of other chart clicks
  creationDateFilter.value = { period, value };
  statusFilter.value = null;
  typeFilter.value = null;
  departmentFilter.value = null;

  emit('filter-creation-date-changed', creationDateFilter.value);
  emit('filter-status-changed', null);
  emit('filter-type-changed', null);
  emit('filter-department-changed', null);
}

const closeSummaryModal = () => {
  isSummaryModalVisible.value = false;
};

// --- Bar Chart for Ticket Trends by Department (Daily) ---
const rawDepartmentTrendDateLabels = ref<string[]>([]); // Store YYYY-MM-DD labels
const departmentTrendStartDate = ref<string>('');
const departmentTrendEndDate = ref<string>('');
// const departmentTrendKey = ref(0); // Not needed if departmentTrendData is computed

const initializeDefaultDates = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14); // Default to last 15 days

  departmentTrendStartDate.value = startDate.toISOString().split('T')[0];
  departmentTrendEndDate.value = endDate.toISOString().split('T')[0];
};

const processedDepartmentTrendData = computed(() => {
  if (!departmentTrendStartDate.value || !departmentTrendEndDate.value || !ticketStore.tickets.length || !departments.value || departments.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  const startStr = departmentTrendStartDate.value; // YYYY-MM-DD
  const endStr = departmentTrendEndDate.value;   // YYYY-MM-DD

  if (startStr > endStr) return { labels: [], datasets: [] };

  const filteredTicketsForRange = ticketStore.tickets.filter(ticket => {
    const createdAt = new Date(ticket.created_at);
    const ticketDateStr = createdAt.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }); // Get YYYY-MM-DD in local time
    return ticketDateStr >= startStr && ticketDateStr <= endStr;
  });

  if (filteredTicketsForRange.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Generate all dates in the range for the X-axis
  const start = new Date(startStr + 'T00:00:00'); // Create Date object for iteration (local time)
  const end = new Date(endStr + 'T00:00:00');   // Create Date object for iteration (local time)
  const _dateLabels: string[] = []; // Renamed to avoid conflict if dateLabels is used elsewhere
  let currentDate = new Date(start); // Start from the beginning of the start date
  while (currentDate <= end) { // Loop until the beginning of the day *after* the end date
    _dateLabels.push(currentDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })); // YYYY-MM-DD format
    currentDate.setDate(currentDate.getDate() + 1);
  }
  rawDepartmentTrendDateLabels.value = [..._dateLabels]; // Store the raw YYYY-MM-DD labels
  const countsByDate: { [date: string]: number } = {}; // Initialize once before the loop

  const datasets = departments.value.map((dept, index) => {
    const departmentCountsOnDate: { [date: string]: number } = {};
    _dateLabels.forEach(label => departmentCountsOnDate[label] = 0);

    filteredTicketsForRange.forEach((ticket: Ticket) => {
      if (ticket.department?.id === dept.id) {
        const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0];
        if (departmentCountsOnDate.hasOwnProperty(ticketDate)) { // แก้ไข: ใช้ตัวนับเฉพาะของแผนกนี้
          departmentCountsOnDate[ticketDate]++;
        }
      }
    });

    const data = _dateLabels.map(label => departmentCountsOnDate[label] || 0);
    const color = primaryColorsPalette[index % primaryColorsPalette.length];

    return {
      label: utilDepartmentName(dept.name), // Label is department name
      originalLabel: dept.name, // Store original English name
      data: data,
      borderColor: color,
      backgroundColor: color, // 
      tension: 0.1,
      fill: false, // Set to true if you want area chart style
    };
  });

  const displayDateLabels = _dateLabels.map(dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  });

  return {
    labels: displayDateLabels, // These are for chart display
    datasets: datasets,
  };
});



const departmentTrendOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { // กำหนดวิธีที่ chart ตอบสนองต่อการชี้
    mode: 'nearest' as const, // หา element ที่ใกล้ที่สุด
    axis: 'x' as const, // พิจารณาตามแนวแกน X
    intersect: true // จะนับว่าโดน element ต่อเมื่อชี้โดนจริงๆ (สำหรับ getActiveElements)
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { title: { display: true, text: 'วันที่' } }
  },
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      mode: 'index' as const, // แสดง tooltip สำหรับทุก dataset ณ index ที่ชี้
      intersect: false, // ให้ tooltip แสดงแม้ว่าจะไม่ได้ชี้โดนแท่งโดยตรง (แค่ชี้ในคอลัมน์วันนั้น)
      callbacks: {
        // title: function(tooltipItems) { // โดยปกติ title จะเป็น label ของแกน X (วันที่) ซึ่งถูกต้องแล้ว
        //   if (tooltipItems.length > 0) {
        //     return processedDepartmentTrendData.value.labels[tooltipItems[0].index];
        //   }
        //   return '';
        // },
        filter: function(tooltipItem: TooltipItem<any>, index: number, tooltipItems: TooltipItem<any>[], data: any) {
          const chart = this as Chart; // 'this' คือ chart instance
          const activeElements = chart.getActiveElements();

          if (activeElements.length === 1) {
            // ถ้าผู้ใช้ชี้โดนแท่งใดแท่งหนึ่งโดยเฉพาะ (intersect: true สำหรับ activeElements)
            // ให้ tooltip แสดงเฉพาะข้อมูลของแท่งนั้น
            const activeElement = activeElements[0];
            return tooltipItem.datasetIndex === activeElement.datasetIndex && tooltipItem.dataIndex === activeElement.index;
          }
          // ถ้าไม่ได้ชี้โดนแท่งใดแท่งหนึ่ง (เช่น ชี้ที่พื้นที่ว่างในคอลัมน์)
          // ให้ tooltip แสดงข้อมูลของทุกแผนกในวันนั้น (พฤติกรรมปกติของ mode: 'index', intersect: false)
          return true;
        },
        label: function(tooltipItem: TooltipItem<any>) {
          const datasetLabel = tooltipItem.dataset.label || '';
          const value = tooltipItem.parsed.y;
          if (value === null || typeof value === 'undefined') return '';
          return `${datasetLabel}: ${value} รายการ`;
        },
        footer: function(tooltipItems: TooltipItem<any>[]) {
          // แสดง "รวมทั้งหมด" เฉพาะเมื่อ tooltip แสดงข้อมูลหลายรายการ (คือไม่ได้ชี้โดนแท่งเดียว)
          if (tooltipItems.length > 1) {
            let sum = 0;
            tooltipItems.forEach(function(item) {
              sum += item.parsed.y;
            });
            return 'รวมทั้งหมด: ' + sum + ' รายการ';
          }
          return '';
        }
      }
    },
  },
  onClick: (event: ChartEvent, initialElements: ActiveElement[], chart: Chart) => { // `initialElements` are the elements directly under the cursor
    // `getElementsAtEventForMode` with `intersect: false` helps find elements in the same "column" (index)
    const elementsForColumn = chart.getElementsAtEventForMode(event.native, 'index', { intersect: false }, true);

    if (elementsForColumn.length > 0) {
      const dataIndex = elementsForColumn[0].index; // This is the index for the day on the x-axis
      const clickedDateYYYYMMDD = rawDepartmentTrendDateLabels.value[dataIndex];

      if (!clickedDateYYYYMMDD) {
        console.warn("Could not determine clicked date for department trend chart.");
        return;
      }

      let departmentOriginalNameToFilter: string | null = null;

      // Check if the `initialElements` (direct click) hit a specific bar segment
      if (initialElements.length > 0 && initialElements[0].datasetIndex !== undefined) {
        const datasetIndex = initialElements[0].datasetIndex;
        // Ensure processedDepartmentTrendData and its datasets are available
        if (processedDepartmentTrendData.value && processedDepartmentTrendData.value.datasets && processedDepartmentTrendData.value.datasets[datasetIndex]) {
          const departmentDataset = processedDepartmentTrendData.value.datasets[datasetIndex];
          if (departmentDataset && (departmentDataset as any).originalLabel) {
            departmentOriginalNameToFilter = (departmentDataset as any).originalLabel;
          }
        }
      }
      handleDailyDepartmentTrendClick(clickedDateYYYYMMDD, departmentOriginalNameToFilter);
    }
  }
}));

function handleDailyDepartmentTrendClick(clickedDateYYYYMMDD: string, departmentOriginalName: string | null) {
  const allTicketsFromStore = ticketStore.tickets as Ticket[];
  let modalTitlePrefix = "";

  if (departmentOriginalName) {
    const departmentDisplayName = utilDepartmentName(departmentOriginalName);
    modalTitlePrefix = `รายการแจ้งปัญหาแผนก ${departmentDisplayName} ในวันที่`;
  } else {
    modalTitlePrefix = "รายการแจ้งปัญหาทั้งหมดในวันที่";
  }

  const filteredTicketsForModal = allTicketsFromStore.filter(ticket => {
    const ticketDate = new Date(ticket.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const dateMatch = ticketDate === clickedDateYYYYMMDD;
    if (!dateMatch) return false;
    if (departmentOriginalName) { // If a specific department is targeted
      return ticket.department?.name === departmentOriginalName;
    }
    return true; // If no specific department, just match the date
  });

  const d = new Date(clickedDateYYYYMMDD + 'T00:00:00'); // Ensure correct date parsing for display
  const displayDate = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  modalStatusTitle.value = `${modalTitlePrefix}: ${displayDate}`;
  ticketsForModal.value = filteredTicketsForModal;
  isSummaryModalVisible.value = true;

  // Update global filters
  departmentFilter.value = departmentOriginalName; // This will be null if no specific department was clicked
  creationDateFilter.value = { period: 'day', value: clickedDateYYYYMMDD };
  statusFilter.value = null;
  typeFilter.value = null;

  emit('filter-department-changed', departmentFilter.value);
  emit('filter-creation-date-changed', creationDateFilter.value);
  emit('filter-status-changed', null);
  emit('filter-type-changed', null);
}

const summary = ref({
  total: 0,
  open: 0,
  in_progress: 0,
  pending: 0,
  closed: 0,
})

const departments = ref<{ id: number; name: string; }[]>([]);

const fetchDepartmentsForChart = async () => {
  try {
    const res = await api.get(`/departments`); // Assuming this endpoint exists
    // Adjust based on your API response structure. Common patterns: res.data or res.data.data. Added more robust check.
    departments.value = Array.isArray(res.data.data) ? res.data.data.map((dept: any) => ({ id: dept.id, name: dept.name })) : Array.isArray(res.data) ? res.data.map((dept: any) => ({ id: dept.id, name: dept.name })) : [];
  } catch (err) {
    console.error("Failed to load departments for chart", err);
  }
};
const primaryColorsPalette = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#F59E0B', // amber-500
  '#10B981', // green-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500 
  '#F97316', // orange-500 
  '#84CC16', // lime-500 
  '#6366F1', // indigo-500 
  '#14B8A6', // teal-500 
];

// Helper function to darken a hex color for the border
const darkenColor = (hexColor: string, percent: number): string => {
  let r = parseInt(hexColor.substring(1, 3), 16);
  let g = parseInt(hexColor.substring(3, 5), 16);
  let b = parseInt(hexColor.substring(5, 7), 16);

  r = Math.floor(r * (1 - percent / 100));
  g = Math.floor(g * (1 - percent / 100));
  b = Math.floor(b * (1 - percent / 100));

  // Ensure values are within 0-255 range
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// For Department Bar Chart (Tickets by Department)
const departmentChartData = ref({
  labels: [] as string[],
  originalLabels: [] as string[], // To store original English labels
  datasets: [{
    label: 'จำนวน Ticket ตามแผนก',
    backgroundColor: [] as string[],
    borderColor: [] as string[],
    borderWidth: 1,
    data: [] as number[],
  }]
});
const departmentChartKey = ref(0);

const departmentChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  onClick: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      // Access originalLabels directly from the component's ref for reliability
      const componentOriginalLabels = departmentChartData.value.originalLabels;

      if (componentOriginalLabels && componentOriginalLabels[elementIndex]) {
        const clickedDepartmentOriginalName = componentOriginalLabels[elementIndex] as string;
        handleDepartmentChartClick(clickedDepartmentOriginalName);
      }
    }
  }
};

const updateDepartmentChart = () => {
  if (!ticketStore.tickets.length || !departments.value.length) {
    // console.log("[AdminDashboard] updateDepartmentChart: Conditions not met. Tickets:", ticketStore.tickets.length, "Departments:", departments.value.length);
    departmentChartData.value = { labels: [], originalLabels: [], datasets: [{ label: 'จำนวน Ticket ตามแผนก', backgroundColor: [], borderColor: [], borderWidth: 1, data: [] }] };
    return;
  }

  const countsByDepartment: { [deptName: string]: number } = {};
  departments.value.forEach(dept => countsByDepartment[dept.name] = 0);

  ticketStore.tickets.forEach((ticket: Ticket) => {
    // Use ticket.department?.name directly if it's the English name from API
    if (ticket.department?.name && countsByDepartment.hasOwnProperty(ticket.department.name)) {
      countsByDepartment[ticket.department.name]++;
    } else if (ticket.department?.id) { // Fallback to ID if name isn't directly matching keys (e.g. if keys were IDs)
      const dept = departments.value.find(d => d.id === ticket.department?.id);
      if (dept && countsByDepartment.hasOwnProperty(dept.name)) {
        countsByDepartment[dept.name]++;
      }
    }
  });

  const originalLabels = Object.keys(countsByDepartment); // English labels
  const displayLabels = originalLabels.map(name => utilDepartmentName(name)); // Thai labels for display
  const data = Object.values(countsByDepartment);

  departmentChartData.value.labels = displayLabels;
  departmentChartData.value.originalLabels = originalLabels; // Store original English labels

  departmentChartData.value.labels = displayLabels;
  departmentChartData.value.datasets[0].data = data;
  departmentChartData.value.datasets[0].backgroundColor = displayLabels.map((_, index) => primaryColorsPalette[index % primaryColorsPalette.length]);
  departmentChartData.value.datasets[0].borderColor = departmentChartData.value.datasets[0].backgroundColor.map(color => darkenColor(color, 15));
  departmentChartKey.value++;
  // console.log("[AdminDashboard] updateDepartmentChart: Chart data updated.", JSON.parse(JSON.stringify(departmentChartData.value)));
};

const updateDepartmentTrendChart = () => {
  // This function might not be strictly necessary if departmentTrendData is computed
  // and the template directly uses processedDepartmentTrendData.
  // However, if you keep it for other reasons, ensure it's called appropriately.
  // departmentTrendKey.value++; // If you still use a ref and key for forcing re-render
};

watch([departmentTrendStartDate, departmentTrendEndDate, () => ticketStore.tickets, departments], () => {
}, { deep: true, immediate: false }); // immediate false to wait for initial fetch
// Watcher for the first department chart
watch([() => ticketStore.tickets, departments], () => {
  if (departments.value.length > 0 && ticketStore.tickets.length > 0) {
    // console.log("[AdminDashboard] Watcher triggered for department chart. Updating chart.");
    updateDepartmentChart();
  } else {
    // console.log("[AdminDashboard] Watcher triggered for department chart. Conditions not met.");
  }
}, { deep: true });

onMounted(async () => {
  if (!ticketStore.tickets || ticketStore.tickets.length === 0) { // โหลดถ้ายังไม่มีข้อมูล หรือโหลดใหม่เสมอตามต้องการ
    await ticketStore.fetchTickets(); // สมมติว่า store มี action นี้
  }
  await fetchTypes(); // Ensure types are fetched for the line chart
  // console.log("[AdminDashboard] Types fetched.");
  await fetchDepartmentsForChart(); // Fetch departments for the bar chart
  // console.log("[AdminDashboard] Departments fetched.");
  initializeDefaultDates(); // Set default date range for line chart
  // console.log("[AdminDashboard] Default dates initialized.");

  // console.log("[AdminDashboard] Fetching summary data...");
  // 2. ดึงข้อมูลสรุปสำหรับ Dashboard และ Chart (รวมการเรียก API ที่ซ้ำซ้อน)
  const res = await api.get(`/dashboard/admin`, {
    headers: {
      Authorization: `Bearer ${auth.accessToken || localStorage.getItem('accessToken')}`, // ควรใช้ token จาก authStore ถ้าเป็นไปได้
    }
  })
  const data: {
    statusSummary: {
      total: number
      open: number
      in_progress: number
      pending: number
      closed: number
    },
    typeSummary: TypeSummary[] // This is for the bar chart, which is now by department
  } = await res.data

  summary.value = data.statusSummary
  console.log("[AdminDashboard] Summary data fetched.");
  console.log(summary)

  // Call chart updates after all data is potentially loaded
  if (departments.value.length > 0 && ticketStore.tickets.length > 0) {
    // console.log("[AdminDashboard] onMounted: Calling updateDepartmentChart and updateDepartmentTrendChart.");
    updateDepartmentChart();
    updateDepartmentTrendChart();
  }
  updateDepartmentTrendChart(); // Initial population of department trend chart data
})
</script>
