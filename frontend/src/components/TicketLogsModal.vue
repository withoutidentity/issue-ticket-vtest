<template>
    <div v-if="visible"
         class="fixed inset-0 transition-opacity overflow-y-auto h-full w-full flex justify-center items-center z-50"
         :class="{
             'bg-[rgba(0,0,0,0.20)] backdrop-blur-sm': visible, // Use explicit RGBA for background and apply backdrop blur
         }"
         @click.self="handleClose">
        <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                    <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <!-- Heroicon name: outline/information-circle -->
                        <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                    </div>
                    <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 class="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                            ประวัติการดำเนินการ Ticket ID: {{ ticketId }}
                        </h3>
                        <div class="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div v-if="logs && logs.length > 0" class="space-y-4">
                                <div v-for="log in sortedLogs" :key="log.id" class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p class="text-sm text-gray-500">
                                        <span class="font-semibold">{{ formatDate(log.timestamp) }}</span>
                                    </p>
                                    <p class="text-sm text-gray-700 mt-1">
                                        <span class="font-medium">ผู้ดำเนินการ:</span> {{ log.user_name }}
                                    </p>
                                    <p class="text-md text-gray-800 mt-1">
                                        <span class="font-medium">รายละเอียด:</span> {{ log.details }}
                                    </p>
                                    <!-- <p class="text-xs text-gray-500 mt-0.5">ประเภท: {{ log.action_type }}</p> -->
                                </div>
                            </div>
                            <div v-else class="text-gray-500 italic py-4 text-center">
                                ไม่มีประวัติการดำเนินการสำหรับ Ticket นี้
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                    type="button"
                    @click="handleClose"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                    ปิด
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';

interface TicketLogEntry {
    id: number;
    timestamp: string;
    user_name: string;
    action_type: string;
    details: string;
}

const props = defineProps({
    visible: {
        type: Boolean,
        required: true,
    },
    logs: {
        type: Array as PropType<TicketLogEntry[]>,
        default: () => [],
    },
    ticketId: {
        type: [String, Number],
        required: true,
    }
});

const emit = defineEmits(['close']);

const handleClose = () => {
    emit('close');
};

const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            // second: '2-digit', // สามารถเพิ่มวินาทีได้หากต้องการ
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Sort logs by timestamp in descending order (newest first)
const sortedLogs = computed(() => {
    return [...props.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});
</script>

<style scoped>
/* Tailwind CSS handles most styling. Add custom styles here if needed. */
/* For smoother scrollbar */
.max-h-\[60vh\]::-webkit-scrollbar {
    width: 8px;
}
.max-h-\[60vh\]::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}
.max-h-\[60vh\]::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
}
.max-h-\[60vh\]::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
