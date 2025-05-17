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
        <!-- แสดงจำนวน Ticket ตามหมวดหมู่พร้อมสี -->
        <div v-if="chartData.labels.length > 0" class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-md font-medium text-gray-600 mb-2">จำนวน Ticket ในแต่ละหมวดหมู่:</h4>
          <ul class="space-y-1">
            <li v-for="(label, index) in chartData.labels" :key="label" class="flex items-center text-sm">
              <span 
                class="inline-block w-3 h-3 rounded-full mr-2" 
                :style="{ backgroundColor: chartData.datasets[0].backgroundColor[index] || '#cccccc' }">
              </span>
              <span class="text-gray-700">{{ label }}:</span>
              <span class="ml-1 font-semibold text-gray-800">{{ chartData.datasets[0].data[index] }}</span>
            </li>
          </ul>
        </div>

      </div>
      <!-- New Ticket Creation Trend Chart -->
      <div class="bg-white shadow p-6 rounded">
        <TicketCreationTrendChart />
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

const emit = defineEmits(['filter-status-changed', 'filter-type-changed'])

// interface ticket_types { //  This interface seems unused for status filtering logic
//   id: number
//   name: string
//   description: string
// }

const statusFilter = ref<'open' | 'in_progress' | 'pending' | 'closed' | null>(null);
const typeFilter = ref<string | null>(null);

const types = ref<{ id: number; name: string }[]>([]);

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
  emit('filter-type-changed', typeFilter.value);
  emit('filter-status-changed', null); // Notify parent to clear status filter
}

const filteredTickets = computed(() => {
  let ticketsToFilter = ticketStore.tickets;

    // Filter by status
    if (statusFilter.value) {
        ticketsToFilter = ticketsToFilter.filter(ticket => ticket.status === statusFilter.value);
    }

    // Filter by type
    if (typeFilter.value) {
        ticketsToFilter = ticketsToFilter.filter(ticket => {
          // Use the typeName computed property here to get the type name by ID
          return typeName.value(ticket.type_id) === typeFilter.value
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

// Function to generate a somewhat consistent color from a string
const generateColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
  // // Alternative: Simpler random but less consistent on minor name changes
  // const letters = '0123456789ABCDEF';
  // let color = '#';
  // for (let i = 0; i < 6; i++) {
  //   color += letters[Math.floor(Math.random() * 16)];
  // }
  // return color;
};

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'จำนวน Ticket',
    backgroundColor: [], // Will be populated dynamically
    borderColor: [], // Optional: if you want borders for bars
    data: [],
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  onClick: (event, elements, chart) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      // Ensure labels exist and are strings before trying to access
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
  chartData.value.datasets[0].backgroundColor = typeLabels.map(label => generateColorFromString(label));
  // console.log('Chart Data value:', chartData.value); // หากต้องการดูค่าใน ref

  chartKey.value++ // force re-render chart
})
</script>
