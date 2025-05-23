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

const emit = defineEmits(['filter-by-creation-date']);

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
const selectedBarOriginalKey = ref<string | null>(null); // To track the clicked bar's original key
const chartKey = ref(0); // To force re-render chart

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


  sortedLabels.forEach((label, index) => {
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

    const baseColorHex = primaryColorsPalette[index % primaryColorsPalette.length];
    const isSelected = selectedBarOriginalKey.value === label;

    if (selectedBarOriginalKey.value) { // If any bar is selected
      if (isSelected) {
        backgroundColors.push(baseColorHex); // Selected bar keeps its color
        borderColors.push(darkenColor(baseColorHex, darkenPercent));
      } else {
        backgroundColors.push(baseColorHex + '66'); // Dim non-selected bars (e.g., ~40% opacity)
        borderColors.push(darkenColor(baseColorHex, darkenPercent) + '66');
      }
    } else { // No bar is selected, all bars normal
      backgroundColors.push(baseColorHex);
      borderColors.push(darkenColor(baseColorHex, darkenPercent));
    }
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
    originalKeys: sortedLabels, // Expose original keys for click handler
  };
});

const chartData = computed(() => processedChartData.value);

const handleBarClick = (originalKey: string | null) => {
  if (!originalKey) return;

  if (selectedBarOriginalKey.value === originalKey) {
    selectedBarOriginalKey.value = null; // Toggle off
    emit('filter-by-creation-date', null);
  } else {
    selectedBarOriginalKey.value = originalKey;
    emit('filter-by-creation-date', {
      period: selectedPeriod.value,
      value: originalKey,
    });
  }
  chartKey.value++; // Force re-render to update colors
};

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  onClick: (event: unknown, elements: { index: number }[], chart: any) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      // Use originalKeys from processedChartData which are not formatted for display
      const originalKey = processedChartData.value.originalKeys[elementIndex];
      if (originalKey) {
        handleBarClick(originalKey);
      }
    }
  },
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
  selectedBarOriginalKey.value = null; // Clear selection when period changes
  emit('filter-by-creation-date', null); // Inform parent that filter is cleared
  // The chart will update automatically due to computed properties
  // Force re-render chart if needed for options changes like axis titles
  chartKey.value++;
};


onMounted(() => {
  fetchTicketsForTrend();
});

watch(() => selectedPeriod.value, () => {
    // If external logic could clear selectedBarOriginalKey based on other filters,
    // this watch isn't strictly needed for just period changes as setPeriod handles it.
    // However, if selectedBarOriginalKey could be cleared externally, this ensures chart updates.
    chartKey.value++;
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
