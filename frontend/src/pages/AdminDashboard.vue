<template>
  <div class="p-6 w-full">
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white shadow p-4 rounded">
        <p class="text-gray-600">ทั้งหมด</p>
        <p class="text-3xl font-bold">{{ summary.total }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded">
        <p class="text-gray-600">รอดำเนินการ</p>
        <p class="text-3xl font-bold">{{ summary.open }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded">
        <p class="text-gray-600">กำลังดำเนินการ</p>
        <p class="text-3xl font-bold">{{ summary.in_progress }}</p>
      </div>
      <div class="bg-white shadow p-4 rounded">
        <p class="text-gray-600">ดำเนินการเสร็จ</p>
        <p class="text-3xl font-bold">{{ summary.closed }}</p>
      </div>
    </div>

    <div class="w-full grid grid-cols-2 gap-4 mb-6 ">
      <div class="bg-white shadow p-4 rounded ">
        <div class="h-[300px]">
          <h3 class="text-lg font-semibold mb-2">Ticket ตามหมวดหมู่</h3>
          <!-- กราฟกลุ่มตามเดือน -->
          <Bar :data="chartData" :options="chartOptions" :key="chartKey" />
        </div>
        <!-- วงกลม -->
        <!-- <Pie :data="pieData" :options="{
          responsive: true,
          plugins: { legend: { position: 'right' } }}" /> -->

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { config } from '@/config';
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

const summary = ref({
  total: 0,
  open: 0,
  in_progress: 0,
  pending: 0,
  closed: 0,
})

const chartData = ref({
  labels: [],
  datasets: [{
    label: 'จำนวน Ticket',
    backgroundColor: '#60a5fa',
    data: [],
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

onMounted(async () => {
  const res = await fetch(`${config.apiUrl}/api/dashboard/admin`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
  } = await res.json()

  summary.value = data.statusSummary
  chartData.value.labels = data.typeSummary.map((t: TypeSummary) => t.name)
  chartData.value.datasets[0].data = data.typeSummary.map((t: TypeSummary) => t.count)
  console.log('Chart Data:', chartData.value.datasets[0].data)
})

const chartKey = ref(0)

onMounted(async () => {
  const res = await fetch(`${config.apiUrl}/api/dashboard/admin`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    }
  })
  const data = await res.json()

  summary.value = data.statusSummary
  chartData.value.labels = data.typeSummary.map((t: any) => t.name)
  chartData.value.datasets[0].data = data.typeSummary.map((t: any) => t.count)

  chartKey.value++ // force re-render chart
})
</script>
