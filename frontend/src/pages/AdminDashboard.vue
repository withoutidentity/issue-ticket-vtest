<template>
  <div class="p-6 w-full">
    <div class="grid lg:grid-cols-4 sm:grid-cols-2 gap-4 mb-6">
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100">
        <p class="text-gray-600" @click="filterByStatus('total')">ทั้งหมด</p>
        <p class="text-3xl font-bold">{{ summary.total }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByStatus('open')">
        <p class="text-gray-600">รอดำเนินการ</p>
        <p class="text-3xl font-bold">{{ summary.open }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByStatus('in_progress')">
        <p class="text-gray-600">กำลังดำเนินการ</p>
        <p class="text-3xl font-bold">{{ summary.in_progress }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByStatus('closed')">
        <p class="text-gray-600">ดำเนินการเสร็จ</p>
        <p class="text-3xl font-bold">{{ summary.closed }}</p>
      </div>
    </div>

    <div class="w-full grid xl:grid-cols-2 lg:grid-cols-1 gap-4 overflow-x-auto">
      <div class="bg-white shadow p-6 rounded ">
        <h3 class="text-xl font-semibold mb-4 text-gray-700">Ticket ตามแผนก</h3>
        <div class="h-[350px] mb-6">
          <!-- กราฟกลุ่มตามเดือน -->
          <Bar :data="departmentChartData" :options="departmentChartOptions" :key="departmentChartKey" />
        </div>
      </div>
      <!-- New Ticket Creation Trend Chart -->
      <div class="bg-white shadow p-6 rounded">
        <TicketCreationTrendChart @filter-by-creation-date="handleCreationDateFilterChanged" />
      </div>

    </div>
    <div class="bg-white shadow p-6 rounded md:col-span-2">
      <h3 class="text-xl font-semibold mb-4 text-gray-700">แนวโน้ม Ticket ตามแผนก (รายวัน)</h3>
      <div class="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div>
          <label for="departmentTrendStartDate" class="block text-sm font-medium text-gray-700">วันที่เริ่มต้น:</label>
          <input type="date" id="departmentTrendStartDate" v-model="departmentTrendStartDate"
            @change="updateDepartmentTrendChart"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
        <div>
          <label for="departmentTrendEndDate" class="block text-sm font-medium text-gray-700">วันที่สิ้นสุด:</label>
          <input type="date" id="departmentTrendEndDate" v-model="departmentTrendEndDate"
            @change="updateDepartmentTrendChart"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
      </div>
      <div class="h-[400px]">
        <Bar v-if="processedDepartmentTrendData.labels && processedDepartmentTrendData.labels.length > 0"
          :data="processedDepartmentTrendData" :options="departmentTrendOptions" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          {{ (ticketStore.loading && !ticketStore.tickets.length) ? 'กำลังโหลดข้อมูล...' :
            'กรุณาเลือกช่วงวันที่หรือไม่พบข้อมูลสำหรับช่วงที่เลือก' }}
        </div>
      </div>
    </div>
    <TicketSummaryModal :visible="isSummaryModalVisible" :tickets="ticketsForModal" :status-title="modalStatusTitle"
      @close="closeSummaryModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineEmits, watch } from 'vue'
import { config } from '@/config';
import api from '@/api/axios-instance'

import { useTicketStore } from '@/stores/ticketStore'
import { useAuthStore } from "@/stores/auth";
import TicketCreationTrendChart from '@/components/TicketCreationTrendChart.vue'
import TicketSummaryModal from '@/components/TicketSummaryModal.vue';


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
  TimeSeriesScale,
} from 'chart.js'
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
    modalStatusTitle.value = departmentName;
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

const closeSummaryModal = () => {
  isSummaryModalVisible.value = false;
};

// --- Bar Chart for Ticket Trends by Department (Daily) ---
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
  const dateLabels: string[] = [];
  let currentDate = new Date(start); // Start from the beginning of the start date
  while (currentDate <= end) { // Loop until the beginning of the day *after* the end date
    dateLabels.push(currentDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })); // YYYY-MM-DD format
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const countsByDate: { [date: string]: number } = {}; // Initialize once before the loop

  const datasets = departments.value.map((dept, index) => {
    const departmentCountsOnDate: { [date: string]: number } = {};
    dateLabels.forEach(label => departmentCountsOnDate[label] = 0);

    filteredTicketsForRange.forEach((ticket: Ticket) => {
      if (ticket.department?.id === dept.id) {
        const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0];
        if (departmentCountsOnDate.hasOwnProperty(ticketDate)) { // แก้ไข: ใช้ตัวนับเฉพาะของแผนกนี้
          departmentCountsOnDate[ticketDate]++;
        }
      }
    });

    const data = dateLabels.map(label => departmentCountsOnDate[label] || 0);
    const color = primaryColorsPalette[index % primaryColorsPalette.length];

    return {
      label: dept.name, // Label is department name
      data: data,
      borderColor: color,
      backgroundColor: color, // 
      tension: 0.1,
      fill: false, // Set to true if you want area chart style
    };
  });

  const displayDateLabels = dateLabels.map(dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  });

  return {
    labels: displayDateLabels,
    datasets: datasets,
  };
});

const departmentTrendOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { title: { display: true, text: 'วันที่' } }
  },
  plugins: {
    legend: { position: 'top' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}));

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
  onClick: (event: unknown, elements: { index: number }[], chart: any) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      // console.log("[AdminDashboard] Department chart bar clicked. Element index:", elementIndex);
      if (chart.data.labels && chart.data.labels[elementIndex]) {
        const clickedDepartmentName = chart.data.labels[elementIndex] as string;
        // console.log("[AdminDashboard] Clicked department name from chart label:", clickedDepartmentName);
        handleDepartmentChartClick(clickedDepartmentName);
      }
    }
  }
};

const updateDepartmentChart = () => {
  if (!ticketStore.tickets.length || !departments.value.length) {
    // console.log("[AdminDashboard] updateDepartmentChart: Conditions not met. Tickets:", ticketStore.tickets.length, "Departments:", departments.value.length);
    departmentChartData.value = { labels: [], datasets: [{ label: 'จำนวน Ticket ตามแผนก', backgroundColor: [], borderColor: [], borderWidth: 1, data: [] }] };
    return;
  }

  const countsByDepartment: { [deptName: string]: number } = {};
  departments.value.forEach(dept => countsByDepartment[dept.name] = 0);

  // console.log("[AdminDashboard] updateDepartmentChart: Initial countsByDepartment:", JSON.parse(JSON.stringify(countsByDepartment)));
  ticketStore.tickets.forEach((ticket: Ticket) => {
    // Use ticket.department?.id to match department object in ticket
    // Ensure department_id is a number and not null/empty string before comparing
    if (typeof ticket.department.id === 'number' && ticket.department.id !== null) {
      const dept = departments.value.find(d => d.id === ticket.department.id);
      if (dept && countsByDepartment.hasOwnProperty(dept.name)) {
        countsByDepartment[dept.name]++;
      }
    }
  });
  console.log("[AdminDashboard] updateDepartmentChart: Final countsByDepartment:", JSON.parse(JSON.stringify(countsByDepartment)));

  const labels = Object.keys(countsByDepartment);
  const data = Object.values(countsByDepartment);

  departmentChartData.value.labels = labels;
  departmentChartData.value.datasets[0].data = data;
  departmentChartData.value.datasets[0].backgroundColor = labels.map((_, index) => primaryColorsPalette[index % primaryColorsPalette.length]);
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
