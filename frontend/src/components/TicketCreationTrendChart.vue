<template>
  <div>
    <h3 class="text-xl font-semibold mb-4 text-gray-700">แนวโน้มการสร้าง Ticket</h3>
    <div class="mb-4 flex space-x-2">
      <button
        @click="setPeriod('day')"
        :class="['px-3 py-1 rounded text-sm', selectedPeriod === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300']"
      >
        รายวัน
      </button>
      <button
        @click="setPeriod('month')"
        :class="['px-3 py-1 rounded text-sm', selectedPeriod === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300']"
      >
        รายเดือน
      </button>
      <button
        @click="setPeriod('year')"
        :class="['px-3 py-1 rounded text-sm', selectedPeriod === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300']"
      >
        รายปี
      </button>
    </div>
    <div class="h-[350px]">
      <Bar v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" :key="chartKey" />
      <div v-else class="flex items-center justify-center h-full text-gray-500">
        {{ isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูล Ticket' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import api from '@/api/axios-instance' // Assuming your API instance is here
import { useAuthStore } from "@/stores/auth"; // For auth token if needed

import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeScale, // Import TimeScale for time-based x-axis
  TimeSeriesScale, // Import TimeSeriesScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'; // Import date adapter

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, TimeScale, TimeSeriesScale)

const auth = useAuthStore();

interface Ticket {
  id: number;
  created_at: string; // Expecting ISO date string e.g., "2023-10-26T10:00:00.000Z"
  // ... other ticket properties
}

type Period = 'day' | 'month' | 'year';

const tickets = ref<Ticket[]>([]);
const selectedPeriod = ref<Period>('day'); // Default period
const isLoading = ref(true);
const chartKey = ref(0); // To force re-render chart

// Helper function to generate a random hex color
const getRandomHexColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Helper function to darken a hex color for the border
const darkenColor = (hexColor: string, percent: number): string => {
  let r = parseInt(hexColor.substring(1, 3), 16);
  let g = parseInt(hexColor.substring(3, 5), 16);
  let b = parseInt(hexColor.substring(5, 7), 16);

  r = Math.floor(r * (1 - percent / 100));
  g = Math.floor(g * (1 - percent / 100));
  b = Math.floor(b * (1 - percent / 100));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const getOrGeneratePersistentColor = (labelKey: string): string => {
  const storageKey = `chartColor_${labelKey}`;
  let color = localStorage.getItem(storageKey);
  if (!color) {
    color = getRandomHexColor();
    localStorage.setItem(storageKey, color);
  }
  return color;
};

const fetchTicketsForTrend = async () => {
  isLoading.value = true;
  try {
    // Adjust this API endpoint to where you fetch all tickets or tickets with creation dates
    // This endpoint should ideally return tickets with at least 'created_at' field.
    const response = await api.get('/tickets', { // Example endpoint
      headers: {
        Authorization: `Bearer ${auth.accessToken || localStorage.getItem('accessToken')}`,
      },
    });
    // Assuming the API returns { data: Ticket[] } or just Ticket[]
    tickets.value = Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error('Error fetching tickets for trend:', error);
    tickets.value = []; // Clear tickets on error
  } finally {
    isLoading.value = false;
  }
};

const processedChartData = computed(() => {
  if (tickets.value.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  const counts: { [key: string]: number } = {};

  tickets.value.forEach(ticket => {
    const date = new Date(ticket.created_at);
    let key = '';

    if (selectedPeriod.value === 'day') {
      // Format as YYYY-MM-DD
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (selectedPeriod.value === 'month') {
      // Format as YYYY-MM (e.g., "2023-10")
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (selectedPeriod.value === 'year') {
      // Format as YYYY
      key = `${date.getFullYear()}`;
    }

    if (key) {
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  const sortedLabels = Object.keys(counts).sort();

  const displayLabels: string[] = [];
  const dataValues: number[] = [];
  const backgroundColors: string[] = [];
  const borderColors: string[] = [];
  const darkenPercent = 20; // Darken by 20% for border

  sortedLabels.forEach(label => {
    dataValues.push(counts[label]);

    // Format display label
    if (selectedPeriod.value === 'month') {
        const [year, month] = label.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        displayLabels.push(date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' })); // Using 'th-TH' for Thai month names
    } else if (selectedPeriod.value === 'day') {
        const [year, month, day] = label.split('-');
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        displayLabels.push(date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }));
    } else { // year
        displayLabels.push(label);
    }

    // Get or generate persistent color
    const baseColor = getOrGeneratePersistentColor(label); // Use the original, unformatted label as the key
    backgroundColors.push(baseColor);
    borderColors.push(darkenColor(baseColor, darkenPercent));
  });

  return {
    labels: displayLabels,
    datasets: [
      {
        label: 'จำนวน Ticket ที่สร้าง',
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        data: dataValues,
      },
    ],
  };
});

const chartData = computed(() => processedChartData.value);

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        // Ensure only whole numbers are shown on the y-axis
        precision: 0,
      }
    },
    x: {
      title: {
        display: true,
        text: selectedPeriod.value === 'day' ? 'วันที่' : selectedPeriod.value === 'month' ? 'เดือน' : 'ปี',
      },
    },
  },
  plugins: {
    legend: {
      display: true,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y;
          }
          return label;
        }
      }
    }
  }
}));

const setPeriod = (period: Period) => {
  selectedPeriod.value = period;
  // The chart will update automatically due to computed properties
  // Force re-render chart if needed for options changes like axis titles
  chartKey.value++;
};

onMounted(() => {
  fetchTicketsForTrend();
});

// Watch for changes in tickets or selectedPeriod to update chartKey if necessary,
// though computed properties should handle most updates.
watch([tickets, selectedPeriod], () => {
    chartKey.value++;
}, { deep: true });

</script>

<style scoped>
/* Add any specific styles if needed */
</style>
