<template>
    <AppLayout>
        <cardtitle>รายละเอียด Ticket ID: {{ route.params.id }}</cardtitle>
        <card>
            <cardcontent>
                <form @submit.prevent="handleSubmit" class="w-full bg-white rounded-xl overflow-hidden p-6">
                    <!-- ส่วนฟอร์มหลัก -->
                    <div class="space-y-6">
                        <!-- หัวข้อ -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
                            <input v-model="form.title" :readonly="!isEditing"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                :class="{ 'bg-gray-50': !isEditing }" />
                        </div>

                        <!-- รายละเอียด -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                            <textarea v-model="form.description" :readonly="!isEditing"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                :class="{ 'bg-gray-50': !isEditing }" rows="5"></textarea>
                        </div>

                        <!-- ติดต่อ -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">ติดต่อ</label>
                            <input v-model="form.contact" :readonly="!isEditing"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                :class="{ 'bg-gray-50': !isEditing }" />
                        </div>

                        <!-- ข้อมูลแบบ Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <!-- หมวดหมู่ -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                                <select v-model="form.type_id" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option v-for="type in types" :key="type.id" :value="type.id">
                                        {{ type.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- แผนก -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                                <select v-model="form.department_id" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option v-for="department in departments" :key="department.id"
                                        :value="department.id">
                                        {{ department.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- ความสำคัญ -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ</label>
                                <select v-model="form.priority" :disabled="!isEditing"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditing }">
                                    <option value="low">ต่ำ</option>
                                    <option value="medium">กลาง</option>
                                    <option value="high">สูง</option>
                                </select>
                            </div>
                        </div>

                        <!-- ไฟล์แนบ -->
                        <div class="mb-8">
                            <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                ไฟล์แนบ
                            </h2>

                            <div v-if="form.files.length === 0"
                                class="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                ไม่มีไฟล์แนบ
                            </div>

                            <div v-else
                                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                                <div v-for="(file, index) in form.files" :key="file.id"
                                    class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                                    <a :href="`${config.apiUrl}/uploads/${file.filename}`" target="_blank"
                                        rel="noopener noreferrer"
                                        class="block p-4 hover:bg-gray-50 transition-colors duration-200">
                                        <div class="flex items-start">
                                            <div class="mr-3 text-blue-500 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                                                    viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div class="min-w-0">
                                                <p class="text-sm font-medium text-gray-700 truncate">{{ file.filename }}</p>
                                                <button v-if="isEditing === true" type="button" @click="removeExistingFile(index)"
                                                    class="cursor-pointer px-2 py-1 hover:bg-red-300">ลบ</button>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <!-- แนบไฟล์ใหม่ -->
                            <input type="file" multiple @change="handleFileChange" class="input"
                                accept=".pdf,.jpg,.jpeg,.png" />
                            <div v-if="newFiles.length > 0">
                                <h4>ไฟล์ใหม่:</h4>
                                <ul>
                                    <li v-for="(file, index) in newFiles" :key="index">
                                        {{ file.name }}
                                        <button type="button" @click="removeNewFile(index)">ลบ</button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- ปุ่มดำเนินการ -->
                        <div v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'"
                            class="flex justify-end space-x-3 pt-4 border-t">
                            <button v-if="!isEditing" type="button" @click="isEditing = true"
                                class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                แก้ไข
                            </button>

                            <button v-if="isEditing" type="submit"
                                class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                บันทึก
                            </button>

                            <button v-if="isEditing" type="button" @click="cancelEdit"
                                class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-colors duration-200">
                                ยกเลิก
                            </button>
                        </div>
                        <!-- ปุ่มดำเนินการ สำหรับ User-->
                        <div v-if="auth.user.role === 'USER'"
                            class="flex justify-between items-center space-x-3 pt-4 mt-8 border-t">
                            <!-- ปุ่มย้อนกลับ -->
                            <button @click="goBack" type="button"
                                class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>ย้อนกลับ</span>
                            </button>

                            <!-- กลุ่มปุ่มแก้ไข/บันทึก/ยกเลิก -->
                            <div class="flex space-x-3">
                                <!-- ปุ่มแก้ไข (แสดงเมื่อไม่ใช่โหมดแก้ไข) -->
                                <button v-if="!isEditing" type="button" @click="isEditing = true"
                                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไข
                                </button>

                                <!-- ปุ่มบันทึก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                <button v-if="isEditing" type="submit"
                                    class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                    บันทึก
                                </button>

                                <!-- ปุ่มยกเลิก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                <button v-if="isEditing" type="button" @click="cancelEdit"
                                    class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </cardcontent>
        </card>
        <div v-if="auth.user.role === 'ADMIN' || auth.user?.role === 'OFFICER'">
            <cardtitle class="mt-6">ผู้รับผิดชอบ</cardtitle>
            <card>
                <cardcontent>
                    <form @submit.prevent="handleSubmitAssignee" class="overflow-hidden p-6">
                        <div class="space-y-6">
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-4">ชื่อผู้รับผิดชอบ</label>
                                <strong
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                    {{ form.assignee ? form.assignee.name : 'ยังไม่มีผู้รับผิดชอบ' }}
                                </strong>
                            </div>

                            <div v-if="auth.user?.role === 'OFFICER' && !form.assignee?.name" class="mb-6">
                                <button @click="assignToMe" type="button"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    รับเรื่องเอง
                                </button>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                    <select v-model="form.status" :disabled="!isEditingAssignee"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        :class="{ 'bg-gray-50': !isEditingAssignee }">
                                        <option value="open">เปิด</option>
                                        <option value="in_progress">กำลังดำเนินการ</option>
                                        <option value="pending">รอดำเนินการ</option>
                                        <option value="closed">ปิดแล้ว</option>
                                    </select>
                                </div>

                                <div v-if="auth.user.role === 'ADMIN'">
                                    <label
                                        class="block text-sm font-medium text-gray-700 mb-1">เปลี่ยนผู้รับผิดชอบ</label>
                                    <select v-model="selectedUserId" @change="assignUser" :disabled="!isEditingAssignee"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        :class="{ 'bg-gray-50': !isEditingAssignee }">
                                        <option value="" disabled>เลือกผู้รับผิดชอบ</option>
                                        <option v-for="user in officerList" :key="user.id" :value="user.id"
                                            class="py-2">
                                            {{ user.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                                <textarea v-model="form.comment" :readonly="!isEditingAssignee"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    :class="{ 'bg-gray-50': !isEditingAssignee }" rows="5"></textarea>
                            </div>

                            <div class="flex justify-between items-center space-x-3 pt-4 mt-8 border-t">
                                <!-- ปุ่มย้อนกลับ -->
                                <button @click="goBack" type="button"
                                    class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <span>ย้อนกลับ</span>
                                </button>

                                <!-- กลุ่มปุ่มแก้ไข/บันทึก/ยกเลิก -->
                                <div class="flex space-x-3">
                                    <!-- ปุ่มแก้ไข (แสดงเมื่อไม่ใช่โหมดแก้ไข) -->
                                    <button v-if="!isEditingAssignee" type="button" @click="isEditingAssignee = true"
                                        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        แก้ไข
                                    </button>

                                    <!-- ปุ่มบันทึก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                    <button v-if="isEditingAssignee" type="submit"
                                        class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center hover:shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7" />
                                        </svg>
                                        บันทึก
                                    </button>

                                    <!-- ปุ่มยกเลิก (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                                    <button v-if="isEditingAssignee" type="button" @click="cancelEditAssignee"
                                        class="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </cardcontent>
            </card>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { config } from '@/config'
import api from '@/api/axios-instance'
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

import AppLayout from "@/layouts/AppLayout.vue";

import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import Swal from 'sweetalert2';

const route = useRoute()
const router = useRouter()
const isEditing = ref(false)
const isEditingAssignee = ref(false)

const MAX_FILES = 5
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const ticketId = route.params.id

interface TicketType {
    id: number;
    name: string;
    // description?: string; // ถ้ามีข้อมูลนี้จาก API และต้องการใช้
}

interface Department {
    id: number;
    name: string;
}

interface TicketForm {
    id: number;
    title: string;
    description: string;
    type_id: number | ''; // สามารถเป็น number (เมื่อเลือก) หรือ empty string (ค่าเริ่มต้น)
    priority: 'low' | 'medium' | 'high' | '';
    contact: string;
    department_id: number | '';
    assignee: any;
    comment: string;
    status: 'open' | 'in_progress' | 'pending' | 'closed' | ''; // สถานะที่เป็นไปได้ หรือ empty string
    files: Array<{
        id: number;
        filename: string;
        filepath: string;
    }>;
}

const form = ref<TicketForm>({
    id: 0,
    title: '',
    description: '',
    type_id: '',
    priority: '',
    contact: '',
    department_id: '',
    assignee: {
        assignee_id: 0,
        name: ''
    },
    comment: '',
    status: '',
    files: [],
})

const types = ref<TicketType[]>([]);
const departments = ref<Department[]>([]);
const officerList = ref([]);
const selectedUserId = ref("");
// แยกไฟล์เดิม vs ใหม่
const existingFiles = ref<string[]>([]) // ชื่อไฟล์เก่า เช่น 'file1.pdf'
const newFiles = ref<File[]>([])        // ไฟล์ใหม่ (ยังไม่ได้อัปโหลด)

const isAdmin = computed(() => auth.user.role === "ADMIN")
const canSelfAssign = computed(() =>
    auth.user.role === "OFFICER" && !form.value.assignee.assignee_id
)

const goBack = () => {
    router.go(-1) // ย้อนกลับ 1 หน้าในประวัติ
}

async function fetchTicket() {
    const res = await api.get(`/tickets/${route.params.id}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    selectedUserId.value = res.data.assignee_id || ""
    const data = await res.data
    form.value = data as TicketForm;
    console.log('ticket f: ', form.value)
}

async function fetchTypes() {
    const res = await api.get(`/types`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    const data = await res.data
    types.value = data.data as TicketType[];
    console.log('type: ', types.value)
}

async function fetchDepartments() {
    const res = await api.get(`/departments`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
    })
    const data = await res.data
    departments.value = data as Department[];
    console.log('department: ', departments.value)
}

function cancelEdit() {
    isEditing.value = false
    fetchTicket() // รีโหลดข้อมูลเดิม
}

function cancelEditAssignee() {
    isEditingAssignee.value = false
    fetchTicket() // รีโหลดข้อมูลเดิม
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])

  const validFiles = selectedFiles.filter(file =>
    ALLOWED_TYPES.includes(file.type)
  )

  const totalFiles = existingFiles.value.length + newFiles.value.length + validFiles.length
  if (totalFiles > MAX_FILES) {
    alert(`แนบไฟล์ได้สูงสุด ${MAX_FILES} ไฟล์`)
    return
  }

  newFiles.value.push(...validFiles)
}

function removeExistingFile(index: number) {
  existingFiles.value.splice(index, 1)
}

function removeNewFile(index: number) {
  newFiles.value.splice(index, 1)
}

async function handleSubmit() {
    try {
        await api.put(`/update/tickets/${route.params.id}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(form.value),
        })

        await Swal.fire({
            title: 'อัพเดด Ticket สำเร็จ',
            text: 'Ticket ของคุณถูกอัพเดทเรียบร้อยแล้ว',
            icon: 'success',
            showClass: {
                popup: 'animate__animated animate__heartBeat'
            },
            timer: 2000
        })
        isEditing.value = false
        fetchTicket()
    } catch (err) {
        await Swal.fire({
            title: 'ผิดพลาด',
            text: 'ไม่สามารถอัพเดท Ticket ได้: ' + err.message,
            icon: 'error'
        })
    }
}

async function handleSubmitAssignee() {
    try {
        await api.put(`/tickets/${route.params.id}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(form.value),
        })

        await Swal.fire({
            title: 'อัพเดด Ticket สำเร็จ',
            text: 'Ticket ของคุณถูกอัพเดทเรียบร้อยแล้ว',
            icon: 'success',
            showClass: {
                popup: 'animate__animated animate__heartBeat'
            },
            timer: 2000
        })
        isEditing.value = false
        fetchTicket()
    } catch (err) {
        await Swal.fire({
            title: 'ผิดพลาด',
            text: 'ไม่สามารถอัพเดท Ticket ได้: ' + err.message,
            icon: 'error'
        })
    }
}

const loadOfficer = async () => {
    if (isAdmin.value) {
        const res = await api.get("/users/officer")
        officerList.value = res.data
    }
}

const assignUser = async () => {
    await api.put(`/tickets/assign/${ticketId}`, {
        userId: selectedUserId.value,
    })
    await fetchTicket()
}

const assignToMe = async () => {
    await api.put(`/tickets/assign/${ticketId}`, {
        userId: auth.user.id,
    })
    await fetchTicket()
    console.log("Assigned to me")
}

onMounted(() => {
    fetchTicket()
    fetchTypes()
    fetchDepartments()
    loadOfficer()
})
</script>

<style scoped>
.input {
    width: 100%;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 6px;
}
</style>