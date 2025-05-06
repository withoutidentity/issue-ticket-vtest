<template>
    <AppLayout>
        <cardtitle>รายละเอียด Ticket ID: {{ route.params.id }}</cardtitle>
        <card>
            <cardcontent>
                <form @submit.prevent="handleSubmit">
                    <div class="mb-4">
                        <label class="block text-sm font-medium">หัวข้อ</label>
                        <input v-model="form.title" :readonly="!isEditing" class="w-full border p-2 rounded" />
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">รายละเอียด</label>
                        <textarea v-model="form.description" :readonly="!isEditing" class="w-full border p-2 rounded"
                            rows="4" />
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">หมวดหมู่</label>
                        <select v-model="form.type_id" :disabled="!isEditing" class="w-full border p-2 rounded">
                            <option v-for="type in types" :key="type.id" :value="type.id">
                                {{ type.name }}
                            </option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">สถานะ</label>
                        <select v-model="form.status" :disabled="!isEditing" class="w-full border p-2 rounded">
                            <option value="open">เปิด</option>
                            <option value="in_progress">กำลังดำเนินการ</option>
                            <option value="pending">รอดำเนินการ</option>
                            <option value="closed">ปิดแล้ว</option>
                        </select>
                    </div>

                    <div class="flex gap-4">
                        <button v-if="!isEditing" type="button" @click="isEditing = true"
                            class="px-4 py-2 bg-blue-500 text-white rounded">
                            แก้ไข
                        </button>

                        <button v-if="isEditing" type="submit" class="px-4 py-2 bg-green-600 text-white rounded">
                            บันทึก
                        </button>

                        <button v-if="isEditing" type="button" @click="cancelEdit"
                            class="px-4 py-2 bg-gray-400 text-white rounded">
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </cardcontent>
        </card>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { config } from '@/config'

import AppLayout from "@/layouts/AppLayout.vue";

import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';

const route = useRoute()
const router = useRouter()
const isEditing = ref(false)

interface TicketType {
    id: number;
    name: string;
    // description?: string; // ถ้ามีข้อมูลนี้จาก API และต้องการใช้
}

interface TicketForm {
    id: number;
    title: string;
    description: string;
    type_id: number | ''; // สามารถเป็น number (เมื่อเลือก) หรือ empty string (ค่าเริ่มต้น)
    status: 'open' | 'in_progress' | 'pending' | 'closed' | ''; // สถานะที่เป็นไปได้ หรือ empty string
}

const form = ref<TicketForm>({
    id: 0,
    title: '',
    description: '',
    type_id: '',
    status: '',
})

const types = ref<TicketType[]>([]);

async function fetchTicket() {
    const res = await fetch(`${config.apiUrl}/api/tickets/${route.params.id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    const data = await res.json()
    form.value = data as TicketForm;
}

async function fetchTypes() {
    const res = await fetch(`${config.apiUrl}/api/types`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    const data = await res.json()
    types.value = data.data as TicketType[];
    console.log('type: ', types.value)
}

function cancelEdit() {
    isEditing.value = false
    fetchTicket() // รีโหลดข้อมูลเดิม
}

async function handleSubmit() {
    await fetch(`${config.apiUrl}/api/tickets/${route.params.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(form.value),
    })

    isEditing.value = false
    fetchTicket()
}

onMounted(() => {
    fetchTicket()
    fetchTypes()
})
</script>