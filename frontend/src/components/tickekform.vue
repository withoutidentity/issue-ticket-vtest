<template>
    <card>
        <cardcontent>
            <cardtitle>สร้าง Ticket ใหม่</cardtitle>
            <form @submit.prevent="submitTicket" class="mx-auto space-y-6 p-6">
                <!-- Title Field -->
                <div>
                    <label for="title" class="text-sm font-medium text-gray-900">
                        หัวข้อปัญหา <span class="text-red-400">*</span>
                    </label>
                    <input id="title" v-model="title" type="text" placeholder="ระบุหัวข้อปัญหา"
                        class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400"
                        required />
                </div>

                <!-- Description Field -->
                <div class="space-y-2">
                    <label for="description" class="text-sm font-medium text-gray-900">
                        รายละเอียด <span class="text-red-400">*</span>
                    </label>
                    <textarea id="description" v-model="description" placeholder="อธิบายรายละเอียดของปัญหา"
                        class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400 resize-none"
                        rows="4" required></textarea>
                </div>

                <!-- Contact Field -->
                <div class="space-y-2">
                    <label for="contact" class="text-sm font-medium text-gray-900">
                        ข้อมูลติดต่อ <span class="text-red-400">*</span>
                    </label>
                    <input id="contact" v-model="contact" type="text" placeholder="เช่น เบอร์โทรศัพท์ หรือ อีเมล"
                        class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400"
                        required />
                </div>

                <!-- Grid Fields -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Department -->
                    <div class="space-y-2">
                        <label for="department" class="text-sm font-medium text-gray-900">
                            แผนก <span class="text-red-400">*</span>
                        </label>
                        <select id="department" v-model="department_id"
                            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
                            required :disabled="loadingDepartments">
                            <option disabled value="" class="text-gray-400">
                                {{ loadingDepartments ? 'กำลังโหลด...' : '-- เลือกแผนก --' }}
                            </option>
                            <option v-if="!loadingDepartments" v-for="department in departments" :key="department.id"
                                :value="department.id" class="uppercase text-gray-900">
                                {{ department.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Priority -->
                    <div class="space-y-2">
                        <label for="priority" class="text-sm font-medium text-gray-900">
                            ระดับความสำคัญ <span class="text-red-400">*</span>
                        </label>
                        <select id="priority" v-model="priority"
                            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
                            required>
                            <option disabled value="" class="text-gray-400">-- เลือกระดับความสำคัญ --</option>
                            <option value="low" class="text-gray-900">ต่ำ</option>
                            <option value="medium" class="text-gray-900">กลาง</option>
                            <option value="high" class="text-gray-900">สูง</option>
                        </select>
                    </div>

                    <!-- Type -->
                    <div class="space-y-2">
                        <label for="type" class="text-sm font-medium text-gray-900">
                            ประเภท <span class="text-red-400">*</span>
                        </label>
                        <select id="type" v-model="type_id"
                            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
                            required :disabled="loadingTypes">
                            <option disabled value="" class="text-gray-400">
                                {{ loadingTypes ? 'กำลังโหลด...' : '-- เลือกประเภท --' }}
                            </option>
                            <option v-if="!loadingTypes" v-for="type in types" :key="type.id" :value="type.id"
                                class="text-gray-900">
                                {{ `${type.name}: ` }} {{ type.description }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="files" class="block text-sm font-medium text-gray-700 mb-1">เลือกไฟล์ (สูงสุด {{
                        maxFiles }} ไฟล์)</label>
                    <input id="files" type="file" multiple @change="handleFileChange"
                        class="iblock w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                        accept=".pdf, .jpg, .jpeg, .png" />
                    <p class="mt-1 text-xs text-gray-500">
                        ประเภทไฟล์ที่อนุญาต: PDF, JPG, PNG
                    </p>
                    <p v-if="fileError" class="text-red-500 text-sm mt-1">{{ fileError }}</p>
                </div>

                <ul v-if="files.length > 0" class="mt-2 space-y-1">
                    <li v-for="(file, index) in files" :key="index"
                        class="flex justify-between items-center bg-gray-100 px-3 py-1 rounded">
                        <span class="truncate max-w-xs">{{ file.name }}</span>
                        <button type="button" @click="removeFile(index)" class="text-red-500 hover:underline text-sm">
                            ลบ
                        </button>
                    </li>
                </ul>

                <p v-if="formError" class="text-red-500 text-sm">{{ formError }}</p>

                <button type="submit" :disabled="isSubmitting"
                    class="flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 mr-2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    {{ isSubmitting ? 'กำลังส่ง...' : 'ส่ง Ticket' }}
                </button>
            </form>
        </cardcontent>
    </card>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import Swal from 'sweetalert2'
import api from '@/api/axios-instance'

import { useAuthStore } from '@/stores/auth'; // Import auth store
import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import router from '@/router';

const title = ref('')
const description = ref('')
const type_id = ref('')
const department_id = ref('')
const priority = ref('')
// const status = ref('')
const contact = ref('')
const files = ref<File[]>([])
const departments = ref([])
const types = ref([])

const formError = ref('')
const fileError = ref('')
const isSubmitting = ref(false)
const loadingDepartments = ref(false)
const loadingTypes = ref(false)
const auth = useAuthStore(); // Initialize auth store
const maxFiles = 5

function handleFileChange(event: Event) {
    fileError.value = '' // Reset file error
    const input = event.target as HTMLInputElement
    if (!input.files) return

    const selectedFiles = Array.from(input.files)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

    if (selectedFiles.length > maxFiles) {
        fileError.value = `ไม่สามารถแนบไฟล์เกิน ${maxFiles} ไฟล์ได้`
        input.value = '' // รีเซ็ต input
        files.value = [] // Clear existing selected files if any
        return
    }

    const validFiles: File[] = []
    let invalidTypeFound = false
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        if (allowedTypes.includes(file.type)) {
            validFiles.push(file)
        } else {
            invalidTypeFound = true
        }
    }

    if (invalidTypeFound) {
        fileError.value = 'มีไฟล์บางประเภทไม่ได้รับอนุญาต (อนุญาตเฉพาะ PDF, JPG, PNG)'
        // Keep valid files if any, or clear if all are invalid and input was reset
        if (validFiles.length < selectedFiles.length) {
            input.value = '' // Reset input if some files were invalid to force re-selection
            files.value = [] // Clear selection as some were invalid
            return;
        }
    }

    files.value = [...files.value, ...validFiles].slice(0, maxFiles) // Add new valid files, ensuring not to exceed maxFiles
    if (files.value.length > maxFiles) { // Should not happen if initial check is correct, but as a safeguard
        files.value = files.value.slice(0, maxFiles)
        fileError.value = `ไม่สามารถแนบไฟล์เกิน ${maxFiles} ไฟล์ได้`
    }
    // To reflect the actual selected files in the input, this is tricky.
    // Usually, we let the user see their selection and manage `files.value` internally.
    // If input.value is reset, previous valid selections might be lost if not handled carefully.
    // For simplicity, if any file is invalid, we clear the input and ask to reselect.
    // A more advanced component would handle individual file additions/validations better.
}

onMounted(async () => {
    loadingTypes.value = true;
    loadingDepartments.value = true;
    formError.value = ''; // Reset form error on mount
    try {
        const [typesRes, departmentsRes] = await Promise.all([
            api.get(`/types`),
            api.get(`/departments`)
        ]);
        types.value = typesRes.data.data;
        departments.value = departmentsRes.data;
    } catch (error) {
        console.error("Error fetching initial data:", error);
        formError.value = 'ไม่สามารถโหลดข้อมูลเริ่มต้นสำหรับแบบฟอร์มได้';
        Swal.fire('ผิดพลาด!', 'ไม่สามารถโหลดข้อมูลเริ่มต้นได้', 'error');
    } finally {
        loadingTypes.value = false;
        loadingDepartments.value = false;
    }
})

const submitTicket = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return alert('กรุณาเข้าสู่ระบบ')

    const decoded: any = jwtDecode(token)
    const userId = decoded.userId || decoded.id

    formError.value = '' // Reset form error

    if (!title.value || !description.value || !type_id.value || !priority.value || !contact.value || !department_id.value) {
        formError.value = 'กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน';
        return;
    }
    isSubmitting.value = true;
    const result = await Swal.fire({
        title: 'ส่ง Ticket?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ส่ง',
        cancelButtonText: 'ยกเลิก',
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    })
    if (result.isConfirmed) {
        const formData = new FormData()
        formData.append('title', title.value)
        formData.append('description', description.value)
        formData.append('type_id', type_id.value)
        formData.append('priority', priority.value)
        // formData.append('status', status.value)
        formData.append('contact', contact.value)
        formData.append('department_id', department_id.value)
        formData.append('user_id', userId)

        files.value.forEach(file => {
            formData.append('files', file)
        })

        try {
            await api.post(`/tickets/create`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
            Swal.fire({
                title: 'ส่งแล้ว!',
                text: 'ส่งข้อมูลสำเร็จ',
                icon: 'success',
                showClass: {
                    popup: 'animate__animated animate__heartBeat'
                },
                timer: 2000
            });
            if (auth.user.role === 'OFFICER' || auth.user.role === 'ADMIN') {
                router.push('/dashboard')
            } else {
                router.push('/MyTickets')
            }
        } catch (err) {
            await Swal.fire(
                'ส่งไม่สำเร็จ!',
                'เกิดข้อผิดพลาดในการส่ง Ticket: ' + (err.response?.data?.message || err.message),
                'error'
            )
            formError.value = 'เกิดข้อผิดพลาดในการส่ง Ticket โปรดลองอีกครั้ง';
        } finally {
            isSubmitting.value = false;
        }
    } else {
        isSubmitting.value = false; // User cancelled
    }
}

const removeFile = (index: number) => {
    files.value.splice(index, 1)
}

</script>

<style scoped>
.input {
    width: 100%;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 6px;
    box-sizing: border-box;
    /* Added for better layout consistency */
}
</style>