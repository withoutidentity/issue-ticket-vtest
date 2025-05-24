<template>
  <div class="p-6 w-full">
    <!-- Summary Cards for Officer's Department -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByOfficerStatus(null)">
        <p class="text-gray-600">Ticket ทั้งหมด</p>
        <p class="text-3xl font-bold">{{ summary.total }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByOfficerStatus('open')">
        <p class="text-gray-600">รอดำเนินการ</p>
        <p class="text-3xl font-bold">{{ summary.open }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByOfficerStatus('in_progress')">
        <p class="text-gray-600">กำลังดำเนินการ</p>
        <p class="text-3xl font-bold">{{ summary.in_progress }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100" @click="filterByOfficerStatus('closed')">
        <p class="text-gray-600">ดำเนินการเสร็จ</p>
        <p class="text-3xl font-bold">{{ summary.closed }}</p>
      </div>
    </div>

    <!-- Line Chart for Ticket Trends by Category (Daily) for Officer's Department -->
    <div class="bg-white shadow p-6 rounded">
      <h3 class="text-xl font-semibold mb-4 text-gray-700">แนวโน้ม Ticket ตามหมวดหมู่ (รายวัน) - แผนก: {{ auth.user?.department?.name }}</h3>
      <div class="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div>
          <label for="categoryTrendStartDateOfficer" class="block text-sm font-medium text-gray-700">วันที่เริ่มต้น:</label>
          <input type="date" id="categoryTrendStartDateOfficer" v-model="categoryTrendStartDate" @change="updateCategoryTrendChart" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
        <div>
          <label for="categoryTrendEndDateOfficer" class="block text-sm font-medium text-gray-700">วันที่สิ้นสุด:</label>
          <input type="date" id="categoryTrendEndDateOfficer" v-model="categoryTrendEndDate" @change="updateCategoryTrendChart" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>
      </div>
      <div class="h-[400px]">
        <Bar v-if="processedCategoryTrendData.labels && processedCategoryTrendData.labels.length > 0 && !isLoadingChart" :data="processedCategoryTrendData" :options="categoryTrendOptions" :key="categoryTrendKey" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          {{ isLoadingChart ? 'กำลังประมวลผลข้อมูลกราฟ...' : (!processedCategoryTrendData.labels || processedCategoryTrendData.labels.length === 0 ? 'กรุณาเลือกช่วงวันที่ หรือไม่พบข้อมูลสำหรับช่วงที่เลือก' : 'กำลังโหลดข้อมูล Ticket...') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuthStore } from "@/stores/auth";
import api from '@/api/axios-instance';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  TimeSeriesScale,
  BarElement, // Added for Bar chart
} from 'chart.js';
import 'chartjs-adapter-date-fns';
// import { th } from 'date-fns/locale'; // Optional: for Thai date formatting in chart adapter

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, TimeSeriesScale, BarElement);

const emit = defineEmits(['filter-officer-status-changed', 'filter-officer-category-changed']);

const ticketStore = useTicketStore();
const auth = useAuthStore();

const officerDepartmentId = computed(() => auth.user?.department?.id);
const types = ref<{ id: number; name: string }[]>([]);
const isLoadingChart = ref(true);

const summary = computed(() => {
  // Wait for both officerDepartmentId and tickets to be available
  if (!officerDepartmentId.value || !ticketStore.tickets || ticketStore.tickets.length === 0) {
    // console.log("OfficerDashboard: Summary calculation skipped, data not ready.", { officerDeptId: officerDepartmentId.value, ticketsCount: ticketStore.tickets?.length });
    return { total: 0, open: 0, in_progress: 0, pending: 0, closed: 0 };
  }
  // console.log("OfficerDashboard: Calculating summary. Officer Dept ID:", officerDepartmentId.value, "Tickets count:", ticketStore.tickets.length);
  const departmentTickets = ticketStore.tickets.filter(ticket => ticket.department.id === officerDepartmentId.value);
  // console.log("OfficerDashboard: Tickets in officer's department:", departmentTickets.length);

  return {
    total: departmentTickets.length,
    open: departmentTickets.filter(t => t.status === 'open').length,
    in_progress: departmentTickets.filter(t => t.status === 'in_progress').length,
    pending: departmentTickets.filter(t => t.status === 'pending').length, // Assuming pending is a status
    closed: departmentTickets.filter(t => t.status === 'closed').length,
  };
});

const filterByOfficerStatus = (status: 'open' | 'in_progress' | 'closed' | null) => {
  emit('filter-officer-status-changed', status);
};

// --- Category Trend Chart Logic (Changed from Line to Bar) ---
const categoryTrendStartDate = ref<string>('');
const categoryTrendEndDate = ref<string>('');
const categoryTrendKey = ref(0);

const primaryColorsPalette = [ // Re-define or import from a shared utility
  '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899',
];

const initializeDefaultDates = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14); // Default to last 15 days
  categoryTrendStartDate.value = startDate.toISOString().split('T')[0];
  categoryTrendEndDate.value = endDate.toISOString().split('T')[0];
};

const fetchTicketTypes = async () => {
  try {
    const res = await api.get(`/types`);
    types.value = res.data.data.map((type: any) => ({ id: type.id, name: type.name }));
  } catch (err) {
    console.error("Failed to load ticket types for officer chart", err);
  }
};

const processedCategoryTrendData = computed(() => {
  // isLoadingChart.value = true; // Set loading at the beginning of the watcher or on specific actions instead
  if (!categoryTrendStartDate.value || !categoryTrendEndDate.value || !ticketStore.tickets || !ticketStore.tickets.length || !types.value || types.value.length === 0 || !officerDepartmentId.value) {
    // console.log("OfficerDashboard: processedCategoryTrendData - Pre-conditions not met.", {
    //   dates: !!(categoryTrendStartDate.value && categoryTrendEndDate.value),
    //   tickets: ticketStore.tickets?.length,
    //   types: types.value?.length,
    //   officerDeptId: !!officerDepartmentId.value
    // });
    isLoadingChart.value = false;
    return { labels: [], datasets: [] };
  }
  // console.log("OfficerDashboard: processedCategoryTrendData - All pre-conditions met. Processing chart data.");
  const startStr = categoryTrendStartDate.value; // YYYY-MM-DD
  const endStr = categoryTrendEndDate.value;   // YYYY-MM-DD
  const start = new Date(startStr + 'T00:00:00'); // Create Date object for iteration (local time)
  const end = new Date(endStr + 'T00:00:00');   // Create Date object for iteration (local time)

  if (startStr > endStr) {
    isLoadingChart.value = false;
    return { labels: [], datasets: [] };
  }

  const officerTickets = ticketStore.tickets.filter(ticket => ticket.department.id === officerDepartmentId.value);
  const filteredTicketsForRange = officerTickets.filter(ticket => {
    if (!ticket.created_at) return false; // Guard against undefined created_at
    const createdAt = new Date(ticket.created_at);
    // Compare date strings to avoid timezone issues with time part
    const ticketDateStr = createdAt.toLocaleDateString('en-CA'); // YYYY-MM-DD
    return ticketDateStr >= startStr && ticketDateStr <= endStr;
  });

  if (filteredTicketsForRange.length === 0) {
    // console.log("OfficerDashboard: processedCategoryTrendData - No tickets found in the selected date range for the officer's department.");
    isLoadingChart.value = false;
    return { labels: [], datasets: [] };
  }
  // console.log(`OfficerDashboard: processedCategoryTrendData - Found ${filteredTicketsForRange.length} tickets in date range for department ${officerDepartmentId.value}.`);

  const dateLabels: string[] = [];
  let currentDate = new Date(start);
   while (currentDate <= end) { // Loop until the beginning of the day *after* the end date
    dateLabels.push(currentDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })); // YYYY-MM-DD format
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const datasets = types.value.map((type, index) => {
    const countsByDate: { [date: string]: number } = {};
    dateLabels.forEach(label => countsByDate[label] = 0); // Initialize all dates with 0 for this type

    filteredTicketsForRange.forEach(ticket => {
      if (ticket.ticket_types.id === type.id) {
        if (!ticket.created_at) return; // Guard
        const ticketDate = new Date(ticket.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
        if (countsByDate.hasOwnProperty(ticketDate)) {
          countsByDate[ticketDate]++;
        }
      }
    });

    const data = dateLabels.map(label => countsByDate[label]);
    const color = primaryColorsPalette[index % primaryColorsPalette.length];

    return {
      label: type.name,
      data: data,
      backgroundColor: color,
      borderColor: color,
      tension: 0.1,
      fill: false,
    };
  });
  
  const displayDateLabels = dateLabels.map(dateStr => {
    const d = new Date(dateStr + 'T00:00:00'); // Create Date object from YYYY-MM-DD string (local time)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  });

  // console.log("OfficerDashboard: processedCategoryTrendData - Chart data processed successfully.");
  isLoadingChart.value = false;
  return {
    labels: displayDateLabels,
    datasets: datasets,
  };
});

const categoryTrendOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { title: { display: true, text: 'วันที่' } }
  },
  onClick: (event: unknown, elements: { index: number, datasetIndex: number }[], chart: any) => {
    if (elements.length > 0) {
      const { datasetIndex, index } = elements[0];
      const categoryName = chart.data.datasets[datasetIndex]?.label;
      // const dateClicked = chart.data.labels[index]; // If you need the date
      if (categoryName) {
        handleCategoryChartClick(categoryName);
      }
    }
  },
  plugins: {
    legend: { position: 'top' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}));

const updateCategoryTrendChart = () => {
  // This function is primarily to increment the key if still used for forcing re-render
  categoryTrendKey.value++;
};

const handleCategoryChartClick = (categoryName: string) => {
  // Check if the current filter is the same as the clicked category
  // This requires a new ref to store the current category filter for the chart
  // For now, let's just emit. Toggle logic can be added if needed.
  emit('filter-officer-category-changed', categoryName);
};

watch([categoryTrendStartDate, categoryTrendEndDate, () => ticketStore.tickets, types, officerDepartmentId], () => {
  isLoadingChart.value = true; // Set loading before re-calculating
  // console.log("OfficerDashboard: Watcher for category trend chart triggered.");
  updateCategoryTrendChart();
  // isLoadingChart will be set to false at the end of processedCategoryTrendData computation
}, { deep: true, immediate: false }); // immediate: false to avoid running on initial mount before data is ready

onMounted(async () => {
  // console.log("OfficerDashboard: Component mounted.");
  isLoadingChart.value = true;

  // Ensure auth.user.department is available, otherwise summary and chart might not work correctly.
  // This might already be handled by how authStore initializes, but an explicit check or wait could be added if needed.
  // console.log("OfficerDashboard: Current auth user onMount:", JSON.parse(JSON.stringify(auth.user)));

  // Fetch tickets if not already loaded or if a refresh is desired.
  // The ticketStore itself should ideally handle not re-fetching if data is fresh.
  if (!ticketStore.tickets || ticketStore.tickets.length === 0) {
    // console.log("OfficerDashboard: Tickets not found in store, fetching...");
    await ticketStore.fetchTickets();
    // console.log("OfficerDashboard: Tickets fetched, count:", ticketStore.tickets.length);
  } else {
    // console.log("OfficerDashboard: Tickets already in store, count:", ticketStore.tickets.length);
  }

  await fetchTicketTypes();
  initializeDefaultDates();
  // updateCategoryTrendChart(); // Call this to ensure key is incremented and computed property re-evaluates.
  // isLoadingChart will be set to false by the computed property after its first run
});
</script>
