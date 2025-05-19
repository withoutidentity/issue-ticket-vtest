<template>
  <div class="p-6 w-full">
    <div class="grid grid-cols-4 gap-4 mb-6">
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

    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4  ">
      <div class="bg-white shadow p-6 rounded ">
        <h3 class="text-xl font-semibold mb-4 text-gray-700">Ticket ตามหมวดหมู่</h3>
        <div class="h-[350px] mb-6">
          <!-- กราฟกลุ่มตามเดือน -->
          <Bar :data="chartData" :options="chartOptions" :key="chartKey" />
        </div>
      </div>
      <!-- New Ticket Creation Trend Chart -->
      <div class="bg-white shadow p-6 rounded">
        <TicketCreationTrendChart @filter-by-creation-date="handleCreationDateFilterChanged" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineEmits  } from 'vue'
import { config } from '@/config';
import api from '@/api/axios-instance'

import { useTicketStore } from '@/stores/ticketStore'
import { useAuthStore } from "@/stores/auth";
import TicketCreationTrendChart from '@/components/TicketCreationTrendChart.vue'

const auth = useAuthStore();

const emit = defineEmits(['filter-status-changed', 'filter-type-changed', 'filter-creation-date-changed'])

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

const statusFilter = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilter = ref<string | null>(null);
const types = ref<{ id: number; name: string }[]>([]);
const creationDateFilter = ref<CreationDateFilter | null>(null);

const ticketStore = useTicketStore()


import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface TypeSummary {
  name: string
  count: number
}

function filterByStatus(statusToFilter: 'open' | 'in_progress' | 'pending' | 'closed' | 'total' ) {
  if (statusToFilter === 'total') {
    statusFilter.value = null; // Set to null to show all tickets
  } else {
    statusFilter.value = statusToFilter; // Store the selected status
  }
  typeFilter.value = null; // Clear type filter when status filter is applied
  emit('filter-status-changed', statusFilter.value);
  creationDateFilter.value = null; // Clear creation date filter
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

function handleChartClick(typeName: string) {
  if (typeFilter.value === typeName) {
    typeFilter.value = null; // Toggle off if the same type is clicked again
  } else {
    typeFilter.value = typeName;
  }
  statusFilter.value = null; // Clear status filter when type filter is applied
  creationDateFilter.value = null; // Clear creation date filter
  emit('filter-creation-date-changed', null); // Notify parent to clear creation date filter
  emit('filter-type-changed', typeFilter.value);
  emit('filter-status-changed', null); // Notify parent to clear status filter
}

const handleCreationDateFilterChanged = (filter: CreationDateFilter | null) => {
  creationDateFilter.value = filter;
  if (filter) {
    statusFilter.value = null;
    typeFilter.value = null;
    // Notify parent if these filters are managed at a higher level
    emit('filter-status-changed', null);
    emit('filter-type-changed', null);
  }
  emit('filter-creation-date-changed', filter); // Emit the creation date filter to parent
  // Note: The TicketCreationTrendChart itself will update its bar colors
  // because its internal selectedBarOriginalKey changes, triggering a re-render.
  // If other charts needed to clear their selection, they'd need similar logic or props.
};

const filteredTickets = computed(() => {
  let ticketsToFilter = ticketStore.tickets;

    // Filter by status
    if (statusFilter.value) {
        ticketsToFilter = ticketsToFilter.filter(ticket => ticket.status === statusFilter.value);
    }
    // Filter by type
    else if (typeFilter.value) {
        ticketsToFilter = ticketsToFilter.filter(ticket => {
          // Use the typeName computed property here to get the type name by ID
          return typeName.value(ticket.type_id) === typeFilter.value
        });
    }
    // Filter by creation date
    else if (creationDateFilter.value && creationDateFilter.value.value) {
      const { period, value: filterValue } = creationDateFilter.value;
      ticketsToFilter = ticketsToFilter.filter(ticket => {
        const createdAt = new Date(ticket.created_at);
        let ticketKey = '';
        if (period === 'day') {
          ticketKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
        } else if (period === 'month') {
          ticketKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        } else if (period === 'year') {
          ticketKey = `${createdAt.getFullYear()}`;
        }
        return ticketKey === filterValue;
      });

    }
    return ticketsToFilter;
})



const summary = ref({
  total: 0,
  open: 0,
  in_progress: 0,
  pending: 0,
  closed: 0,
})

const primaryColorsPalette = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#F59E0B', // amber-500
  '#10B981', // green-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
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

const chartData = ref({
  labels: [] as string[],
  datasets: [{
    label: 'จำนวน Ticket',
    backgroundColor: [] as string[],
    borderColor: [] as string[],
    borderWidth: 1,
    data: [] as number[],
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  onClick: (event: unknown, elements: { index: number }[], chart: any) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      if (chart.data.labels && chart.data.labels[elementIndex]) {
        const clickedLabel = chart.data.labels[elementIndex] as string;
        handleChartClick(clickedLabel);
      }
    }
  }
}

const chartKey = ref(0)

onMounted(async () => {
  // 1. ดึงข้อมูล Ticket ผ่าน ticketStore
  //    ตรวจสอบว่า ticketStore มี action เช่น fetchTickets() หรือไม่
  //    และ action นั้นมีการอัปเดต state tickets และ loading ใน store
  if (!ticketStore.tickets || ticketStore.tickets.length === 0) { // โหลดถ้ายังไม่มีข้อมูล หรือโหลดใหม่เสมอตามต้องการ
    await ticketStore.fetchTickets(); // สมมติว่า store มี action นี้
  }

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
    typeSummary: TypeSummary[]
  } = await res.data

  summary.value = data.statusSummary
  const typeLabels = data.typeSummary.map((t: TypeSummary) => t.name);
  const typeCounts = data.typeSummary.map((t: TypeSummary) => t.count);
  chartData.value.labels = typeLabels;
  chartData.value.datasets[0].data = typeCounts;  
  chartData.value.datasets[0].backgroundColor = typeLabels.map((label, index) => 
    primaryColorsPalette[index % primaryColorsPalette.length]
  );
  chartData.value.datasets[0].borderColor = chartData.value.datasets[0].backgroundColor.map(color =>
    darkenColor(color, 15) // Darken by 15%
  );
  // console.log('Chart Data value:', chartData.value); // หากต้องการดูค่าใน ref

  chartKey.value++ // force re-render chart
})
</script>
