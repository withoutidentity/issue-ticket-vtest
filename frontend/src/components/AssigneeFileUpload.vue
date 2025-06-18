<template>
    <div class="assignee-file-upload mt-6 p-4 border border-gray-200 rounded-lg shadow-sm">
        <h3 class="text-xl font-semibold mb-4 text-gray-700">แนบไฟล์โดยผู้รับผิดชอบ</h3>
        <div v-if="isLoading" class="text-sm text-gray-500">กำลังโหลดข้อมูลไฟล์...</div>

        <!-- Display existing assignee files -->
        <div v-if="displayedAssigneeFiles && displayedAssigneeFiles.length > 0" class="mb-4">
            <h4 class="text-md font-medium mb-2 text-gray-600">ไฟล์ที่แนบแล้ว:</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                <div v-for="file in displayedAssigneeFiles" :key="file.id"
                    class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 bg-white flex flex-col"
                    :class="{ 'opacity-50 bg-red-50': file.isMarkedForRemoval && !props.disabled }">
                    <div class="p-3 hover:bg-gray-50 transition-colors duration-200 flex-grow ">
                        <!-- ส่วนแสดงไฟล์ -->
                        <a :href="getAssigneeFileUrl(file.filename)" target="_blank" rel="noopener noreferrer"
                            class="flex items-start group">
                            <div class="mr-2 text-blue-500 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="min-w-0">
                                <p
                                    class="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200 break-all"
                                     :class="{ 'line-through': file.isMarkedForRemoval && !props.disabled }">
                                    {{ file.filename }}
                                </p>
                            </div>
                        </a>
                        <span v-if="file.isMarkedForRemoval && !props.disabled" class="text-xs text-red-500 block mt-1">จะถูกลบเมื่อบันทึก</span>
                    </div>

                    <!-- ปุ่มลบ (แสดงเมื่ออยู่ในโหมดแก้ไข) -->
                    <div v-if="!props.disabled" class="border-t border-gray-100 p-2 bg-gray-50">
                        <button
                            v-if="!file.isMarkedForRemoval"
                            @click.stop="confirmDeleteExistingAssigneeFile(file.id, file.filename)" type="button"
                            class="w-full py-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors duration-200 flex items-center justify-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            ลบ
                        </button>
                        <button
                            v-else
                            @click.stop="undoRemoveAssigneeFile(file.id)"
                            type="button"
                            class="w-full py-1 text-yellow-600 hover:text-yellow-700 rounded hover:bg-yellow-50 transition-colors duration-200 flex items-center justify-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l-6 6m0 0l-6-6m6 6V9a6 6 0 0112 0v3M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            ยกเลิกการลบ
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="!isLoading" class="mb-4 text-sm text-gray-500">
            ยังไม่มีไฟล์ที่แนบโดยผู้รับผิดชอบ
        </div>

        <div class="mb-3">
            <label for="assignee-file-input" class="block text-sm font-medium text-gray-700 mb-1">
                เลือกไฟล์ (สูงสุด {{ MAX_FILES }} ไฟล์)
            </label>
            <input id="assignee-file-input" ref="fileInputRef" type="file" multiple @change="handleFileSelection"
                :disabled="props.disabled" :accept="ALLOWED_MIME_TYPES.join(',')"
                class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70" />
            <p class="mt-1 text-xs text-gray-500">
                ประเภทไฟล์ที่อนุญาต: PDF, JPG, PNG (ขนาดไม่เกิน {{ MAX_FILE_SIZE_MB }}MB ต่อไฟล์)
            </p>
        </div>

        <div v-if="selectedFiles.length > 0" class="mb-4">
            <h4 class="text-md font-medium text-gray-600">ไฟล์ที่เลือก ({{ selectedFiles.length }} ไฟล์):</h4>
            <ul class="list-disc list-inside space-y-1 mt-1">
                <li v-for="(file, index) in selectedFiles" :key="index"
                    class="text-sm text-gray-700 flex justify-between items-center py-1">
                    <span>{{ file.name }} <span class="text-gray-500">({{ (file.size / 1024).toFixed(2) }}
                            KB)</span></span>
                    <button type="button" @click="removeSelectedFile(index)" :disabled="props.disabled"
                        class="ml-3 px-2 py-0.5 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded disabled:opacity-50 disabled:cursor-not-allowed">ลบ</button>
                </li>
            </ul>
        </div>

        <div v-if="uploadError" class="mb-3 p-3 text-sm text-red-700 bg-red-100 rounded-md">
            <p class="font-medium">เกิดข้อผิดพลาด:</p>
            <p>{{ uploadError }}</p>
        </div>
        <div v-if="uploadSuccessMessage" class="text-green-700 mb-3 p-3 text-sm bg-green-100 rounded-md">
            {{ uploadSuccessMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import api from '@/api/axios-instance'
import Swal from 'sweetalert2'; // Import SweetAlert2
import { config } from '@/config'

// Interface สำหรับไฟล์ที่มาจาก Backend (AssigneeFile)
interface AssigneeApiFile {
    id: number;
    filename: string;
    filepath: string; // Path ที่เก็บใน server
    ticket_id: number;
    uploadedBy_id: number; // ID ของ assignee
    created_at: string;
}

// Interface for assignee files displayed in the template, including edit-specific properties
interface DisplayAssigneeFile extends AssigneeApiFile {
    isMarkedForRemoval?: boolean;
}

// Props ที่รับมาจาก Parent Component (เช่น TicketDetailPage.vue)
const props = defineProps<{
    ticketId: number;
    initialAssigneeFiles?: AssigneeApiFile[]; // ไฟล์ที่ assignee เคยแนบไว้แล้ว
    disabled?: boolean; // เพิ่ม prop disabled
}>();

// Events ที่จะส่งกลับไปให้ Parent Component
const emit = defineEmits(['files-uploaded']);

const fileInputRef = ref<HTMLInputElement | null>(null); // Ref for file input
const selectedFiles = ref<File[]>([]);
const uploadError = ref<string | null>(null);
const uploadSuccessMessage = ref<string | null>(null);
const isLoading = ref(false);
const currentAssigneeFiles = ref<AssigneeApiFile[]>(props.initialAssigneeFiles || []);
const assigneeFilesToRemove = ref<Set<number>>(new Set());

const MAX_FILES = 5;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']; // สำหรับ input accept
const MAX_FILE_SIZE_MB = 5; // ขนาดสูงสุดต่อไฟล์ (MB)

// Watch for changes in initialAssigneeFiles prop to update local state
watch(() => props.initialAssigneeFiles, (newFiles) => {
    currentAssigneeFiles.value = newFiles || [];
}, { deep: true });

const displayedAssigneeFiles = computed((): DisplayAssigneeFile[] => {
    if (props.disabled) { // If disabled (not in edit mode for assignee)
        return currentAssigneeFiles.value.map(file => ({
            ...file,
            isMarkedForRemoval: false // Or undefined, to match DisplayAssigneeFile
        }));
    }
    return currentAssigneeFiles.value.map(file => ({
        ...file,
        isMarkedForRemoval: assigneeFilesToRemove.value.has(file.id)
    }));
});

const getAssigneeFileUrl = (filename: string) => {
    // Backend serve ไฟล์จาก /uploads/assignee/:filename
    return `${config.apiUrl}/uploads/assignee/${filename}`;
};

const removeSelectedFile = (index: number) => {
    if (props.disabled) return; // Prevent removal if component is disabled
    selectedFiles.value.splice(index, 1);
    // If all files are removed, clear the file input to allow re-selection of the same files
    if (selectedFiles.value.length === 0 && fileInputRef.value) {
        fileInputRef.value.value = '';
    }
};

const handleFileSelection = (event: Event) => {
    uploadError.value = null;
    uploadSuccessMessage.value = null;
    const target = event.target as HTMLInputElement;
    const currentInputFiles = target.files; // Keep a reference to reset if needed
    const files = target.files;

    if (files) {
        if (files.length > MAX_FILES) {
            uploadError.value = `สามารถเลือกไฟล์ได้สูงสุด ${MAX_FILES} ไฟล์เท่านั้น`;
            selectedFiles.value = [];
            if (fileInputRef.value) fileInputRef.value.value = ''; // Clear the input
            target.value = ''; // Also clear the event target's value
            return;
        }

        const newSelectedFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                uploadError.value = `ไฟล์ "${file.name}" มีประเภทไม่ถูกต้อง (${file.type}) อนุญาตเฉพาะ PDF, JPG, PNG เท่านั้น`;
                selectedFiles.value = [];
                if (fileInputRef.value) fileInputRef.value.value = '';
                target.value = '';
                return;
            }
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                uploadError.value = `ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE_MB}MB)`;
                selectedFiles.value = [];
                if (fileInputRef.value) fileInputRef.value.value = '';
                target.value = '';
                return;
            }
            newSelectedFiles.push(file);
        }
        selectedFiles.value = newSelectedFiles;
        // Do not clear target.value here, as it would prevent selecting the same file again after an error if the user fixes it.
        // It's better to clear it only on explicit removal or successful upload.
    }
};
const resetSelectedFiles = () => {
    selectedFiles.value = [];
    if (fileInputRef.value) fileInputRef.value.value = '';
};

const confirmDeleteExistingAssigneeFile = async (fileId: number, filename: string) => {
    if (props.disabled) return; // Should not happen if button is hidden when disabled

    const result = await Swal.fire({
        title: 'ต้องการลบไฟล์นี้หรือไม่?',
        text: `ไฟล์ "${filename}" จะถูกลบเมื่อคุณกดบันทึกการแก้ไขของผู้รับผิดชอบ`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, มาร์คว่าลบ',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        assigneeFilesToRemove.value.add(fileId);
        Swal.fire('มาร์คว่าลบแล้ว', `ไฟล์ "${filename}" จะถูกลบเมื่อบันทึก`, 'info');
    }
};

const undoRemoveAssigneeFile = (fileId: number) => {
    if (props.disabled) return;
    assigneeFilesToRemove.value.delete(fileId);
};


const uploadFiles = async (): Promise<boolean> => { // Return true on success, false on failure
    if (selectedFiles.value.length === 0) {
        uploadError.value = 'กรุณาเลือกไฟล์ก่อนอัปโหลด';
        // It's not an error if no files are selected, just nothing to upload for this specific action.
        // However, if called programmatically, the caller might expect an explicit "nothing to do".
        return true; // Or false if the caller expects an explicit "no files selected" failure. Let's stick to true if no files.
    }
    isLoading.value = true;
    uploadError.value = null;
    uploadSuccessMessage.value = null;
    let uploadSuccessful = false; // Track success

    const formData = new FormData();
    selectedFiles.value.forEach(file => {
        // ชื่อ field 'assignee_attachments' ต้องตรงกับที่ backend (Multer) คาดหวัง
        formData.append('assignee_attachments', file);
    });

    try {
        const token = localStorage.getItem('accessToken'); // หรือวิธีที่คุณใช้เก็บ Token
        if (!token) {
            uploadError.value = 'ไม่พบ Token สำหรับยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่';
            isLoading.value = false;
            return false; // Indicate failure
        }

        const response = await api.post<{
            success: boolean;
            message: string;
            data?: { // data จาก backend คือ updatedTicketWithAllFiles
                id: number;
                // ... other ticket properties
                assigneeFiles?: AssigneeApiFile[]; // สำคัญ: backend ต้อง return ส่วนนี้มาด้วย
            };
            error?: string;
        }>(
            `/tickets/${props.ticketId}/assignee-files`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (response.data.success) {
            uploadSuccessMessage.value = response.data.message || 'อัปโหลดไฟล์สำเร็จ!';
            selectedFiles.value = [];
            if (fileInputRef.value) fileInputRef.value.value = ''; // Clear the file input

            // อัปเดตรายการไฟล์ที่แสดงผลทันทีจากข้อมูลที่ได้จาก API
            if (response.data.data && response.data.data.assigneeFiles) {
                currentAssigneeFiles.value = response.data.data.assigneeFiles;
            }
            // แจ้ง Parent Component ว่ามีการอัปโหลดไฟล์สำเร็จ พร้อมข้อมูล Ticket ที่อัปเดตแล้ว
            emit('files-uploaded', response.data.data);
            uploadSuccessful = true;
        } else {
            uploadError.value = response.data.message || response.data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์';
        }
    } catch (error: any) {
        console.error('Upload error details:', error);
        if (error.response && error.response.data) {
            uploadError.value = error.response.data.message || error.response.data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
        } else if (error.request) {
            uploadError.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } else {
            uploadError.value = 'เกิดข้อผิดพลาดที่ไม่คาดคิด: ' + error.message;
        }
    } finally {
        isLoading.value = false;
    }
    return uploadSuccessful;
};

const resetFilesToRemoveState = () => {
    assigneeFilesToRemove.value.clear();
};

defineExpose({
    uploadFiles,
    selectedFiles, // Expose selectedFiles to check its length
    resetSelectedFiles, // Expose method to reset selected files
    assigneeFilesToRemove, // Expose this
    resetFilesToRemoveState // Expose method to reset this state
});
</script>

<style scoped>
/* สามารถเพิ่ม CSS ที่นี่ถ้าต้องการ หรือใช้ Tailwind CSS classes ด้านบน */
.file\:bg-blue-50:hover {
    /* ตัวอย่างการ custom hover state ของ file input button */
    background-color: #DBEAFE;
    /* Tailwind's blue-100 */
}
</style>
