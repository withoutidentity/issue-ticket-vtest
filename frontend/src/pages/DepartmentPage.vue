<template>
  <AppLayout>
    <card>
      <cardcontent>
        <div class="space-y-6">
          <!-- ส่วนหัวกับปุ่มเพิ่ม -->
          <div class="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div class="flex flex-col">
              <cardtitle>หน้าจัดการแผนก</cardtitle>
              <p class="text-sm text-gray-600 font-medium ml-3">
                รายการแผนกทั้งหมด:
                <span class="text-blue-600 font-semibold">{{ departments.length }}</span>
                แผนก
              </p>
            </div>
            <button @click="openAddModal"
              class="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center sm:justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              เพิ่มแผนกใหม่
            </button>
          </div>

          <!-- Modal เพิ่มแผนก -->
          <div v-if="isAddModalOpen"
            class="fixed inset-0 flex items-center justify-center h-screen backdrop-blur-sm bg-black/60 z-50">
            <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg mx-4 sm:mx-auto border border-gray-200">
              <h3 class="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มแผนก
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อแผนก <span
                      class="text-red-500">*</span></label>
                  <input v-model="newDepartment.name" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอกชื่อแผนก" @keyup.enter="addDepartment" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Group ID (Optional)</label>
                  <input v-model="newDepartment.group_id" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอก Group ID" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Thread ID (Topic กำลังดำเนินการ) (Optional)</label>
                  <input v-model="newDepartment.thread_id_inprogress" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอก Thread ID Topic กำลังดำเนินการ" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Thread ID (Topic ดำเนินการเสร็จแล้ว) (Optional)</label>
                  <input v-model="newDepartment.thread_id_done" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอก Thread ID Topic ดำเนินการเสร็จแล้ว" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">IT Target Thread Index (Optional)</label>
                  <input v-model.number="newDepartment.it_target_thread_index" type="number" min="0"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอก IT Target Thread Index" />
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button @click="closeAddModal"
                  class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  ยกเลิก
                </button>
                <button @click="addDepartment"
                  class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                  :disabled="!newDepartment.name" :class="{ 'opacity-50 cursor-not-allowed': !newDepartment.name }">
                  บันทึก
                </button>
              </div>
            </div>
          </div>

          <!-- Modal แก้ไขแผนก -->
          <div v-if="isEditModalOpen"
            class="fixed inset-0 flex items-center justify-center h-screen backdrop-blur-sm bg-black/60 z-50">
            <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg mx-4 sm:mx-auto border border-gray-200">
              <h3 class="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                แก้ไขแผนก
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อแผนก <span class="text-red-500">*</span></label>
                  <input v-model="editingDepartmentData.name" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอกชื่อแผนก" @keyup.enter="updateDepartment" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Group ID (Optional)</label>
                  <input v-model="editingDepartmentData.group_id" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอก Group ID" />
                </div>
                <!-- Conditional Thread ID inputs -->
                <template v-if="isEditingITDepartment">
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Thread ID (สำหรับ IT - แก้ไขได้)</label>
                    <div v-if="editingDepartmentData.raw_thread_ids && editingDepartmentData.raw_thread_ids.length > 0" class="space-y-2 max-h-40 overflow-y-auto pr-2">
                      <div v-for="(tid, index) in editingDepartmentData.raw_thread_ids" :key="`it-thread-${index}`" class="flex items-center">
                        <input
                          v-model="editingDepartmentData.raw_thread_ids[index]"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                          :placeholder="`Thread ID ${index + 1}`"
                        />
                        <!-- Optional: Button to remove a thread_id could be added here -->
                      </div>
                    </div>
                    <p v-else class="text-sm text-gray-500 mt-1">ไม่มีข้อมูล Thread ID</p>
                    <!-- Optional: Button to add a new thread_id input could be added here -->
                  </div>
                </template>
                <template v-else>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Thread ID (Topic กำลังดำเนินการ) (Optional)</label>
                    <input v-model="editingDepartmentData.thread_id_inprogress" type="text"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="กรอก Thread ID Topic กำลังดำเนินการ" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Thread ID (Topic ดำเนินการเสร็จแล้ว) (Optional)</label>
                    <input v-model="editingDepartmentData.thread_id_done" type="text"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="กรอก Thread ID Topic ดำเนินการเสร็จแล้ว" />
                  </div>
                </template>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">IT Target Thread Index (Optional)</label>
                  <input v-model.number="editingDepartmentData.it_target_thread_index" type="number" min="0"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอก IT Target Thread Index" />
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button @click="closeEditModal"
                  class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                  ยกเลิก
                </button>
                <button @click="updateDepartment"
                  class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                  :disabled="!editingDepartmentData.name"
                  :class="{ 'opacity-50 cursor-not-allowed': !editingDepartmentData.name }">
                  บันทึก
                </button>
              </div>
            </div>
          </div>

          <!-- ตารางแสดงข้อมูล -->
          <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table class="w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อแผนก
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="data in departments" :key="data.id" class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ utilDepartmentName(data.name) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex justify-end space-x-3 items-center">
                      <button @click="openEditModal(data)" title="แก้ไข"
                        class="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded hover:bg-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button @click="confirmDelete(data.id)" title="ลบ"
                        class="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded hover:bg-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </cardcontent>
    </card>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';

// import { config } from '@/config'; // config is not used
import { ref, onMounted } from 'vue'
// import axios from 'axios' // axios is not directly used, api instance is
import Swal from 'sweetalert2'
import api from '@/api/axios-instance'
import { departmentName as utilDepartmentName } from '@/utils/ticketUtils';

interface Department {
  id: number;
  name: string;
  group_id?: string | null;
  raw_thread_ids?: string[] | null; // Add raw array for IT display
  thread_id_inprogress?: string | null;
  thread_id_done?: string | null;
  it_target_thread_index?: number | null;
}
const departments = ref<Department[]>([])

const fetchDepartments = async () => {
  const res = await api.get(`/departments`)
  departments.value = res.data
}

onMounted(fetchDepartments)

const confirmDelete = async (id: number) => {
  const result = await Swal.fire({
    title: 'คุณแน่ใจหรือไม่?',
    text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    cancelButtonText: 'ยกเลิก',
    confirmButtonText: 'ตกลง',
    backdrop: `
      rgba(0,0,0,0.4)
      url("/images/nyan-cat.gif")
      left top
      no-repeat
    `
  })

  if (result.isConfirmed) {
    try {
      // เรียก API เพื่อลบข้อมูล
      try {
        const { data } = await api.get(`/departments/check/${id}`);
        if (data.isUsed) {
          await Swal.fire(
            'ผิดพลาด!',
            'ข้อมูลนี้ถูกใช้งานอยู่ในระบบ ไม่สามารถลบได้',
            'error'
          )
        } else {
          api.delete(`/departments/delete/${id}`)
          console.log('delete department id: ', id)
          await Swal.fire(
            'ลบแล้ว!',
            'รายการของคุณถูกลบเรียบร้อยแล้ว',
            'success'
          )
        }

        fetchDepartments()
      } catch (error) {
        console.error('Error deleting department:', error) // ลบหมวดหมู่ไม่่สำเร็จ
      }

      // fetchItems()
    } catch (error) {
      // กรณีเกิดข้อผิดพลาด
      await Swal.fire(
        'ผิดพลาด!',
        'ไม่สามารถลบรายการได้: ' + error.message,
        'error'
      )
    }
  }
}

const isAddModalOpen = ref(false);
const newDepartment = ref({
  name: '',
  group_id: '',
  thread_id_inprogress: '',
  thread_id_done: '',
  it_target_thread_index: null as number | null,
});

// ฟังก์ชันเปิด Modal
const openAddModal = () => {
  isAddModalOpen.value = true;
};

// ฟังก์ชันปิด Modal
const closeAddModal = () => {
  isAddModalOpen.value = false;
  newDepartment.value = {
    name: '',
    group_id: '',
    thread_id_inprogress: '',
    thread_id_done: '',
    it_target_thread_index: null,
  }; // รีเซ็ตข้อมูล
};
// ฟังก์ชันเพิ่มประเภทใหม่
const addDepartment = async () => {
  try {
    if (!newDepartment.value.name) {
      Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อแผนก', 'warning');
      return;
    }

    const payload = { ...newDepartment.value };
    if (isNaN(payload.it_target_thread_index as number)) {
        payload.it_target_thread_index = null;
    }

    const response = await api.post(`/departments/create`, payload);

    // Assuming backend returns { success: true, data: ... } or throws error for non-2xx
    if (response.data && response.data.success) { // Check for success property from backend
      fetchDepartments(); // ดึงข้อมูลใหม่
      closeAddModal(); // ปิด Modal
      Swal.fire('สำเร็จ!', 'เพิ่มแผนกใหม่เรียบร้อยแล้ว', 'success');
    } else {
      Swal.fire('ผิดพลาด!', response.data.message || 'เกิดข้อผิดพลาดในการสร้างแผนก', 'error');
    }
  } catch (error: any) {
    console.error('Error adding department:', error);
    // แสดงข้อความ error จาก backend ถ้ามี
    const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
    Swal.fire('ผิดพลาด!', errorMessage, 'error');
  }
};

// สถานะและฟังก์ชันสำหรับ Modal แก้ไข
const isEditModalOpen = ref(false);
const isEditingITDepartment = ref(false); // Flag for IT department
const editingDepartmentData = ref({
  id: 0,
  name: '',
  group_id: null as string | null,
  raw_thread_ids: [] as (string | null)[], // To store raw_thread_ids for IT display
  thread_id_inprogress: null as string | null,
  thread_id_done: null as string | null,
  it_target_thread_index: null as number | null,
});

// ฟังก์ชันเปิด Modal แก้ไข
const openEditModal = (department: Department) => {
  isEditingITDepartment.value = department.name === 'it';
  editingDepartmentData.value = {
    id: department.id,
    name: department.name,
    group_id: department.group_id || null,
    raw_thread_ids: department.raw_thread_ids || [], // Populate for IT display
    thread_id_inprogress: department.thread_id_inprogress || null, // Use mapped value for editing
    thread_id_done: department.thread_id_done || null, // Use mapped value for editing
    it_target_thread_index: department.it_target_thread_index ?? null,
  };
  isEditModalOpen.value = true;
};

// ฟังก์ชันปิด Modal แก้ไข
const closeEditModal = () => {
  isEditModalOpen.value = false;
  // Reset data if needed, or rely on openEditModal to repopulate
};

// ฟังก์ชันอัปเดตแผนก
const updateDepartment = async () => {
  if (!editingDepartmentData.value.name) {
    Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อแผนก', 'warning');
    return;
  }

  try {
    const payloadData: any = {
      name: editingDepartmentData.value.name,
      group_id: editingDepartmentData.value.group_id,
      it_target_thread_index: editingDepartmentData.value.it_target_thread_index,
    };

    if (isNaN(payloadData.it_target_thread_index as number)) {
        payloadData.it_target_thread_index = null;
    }

    if (isEditingITDepartment.value) {
      payloadData.raw_thread_ids = editingDepartmentData.value.raw_thread_ids.map(id => (id === null || id === undefined) ? '' : String(id));
    } else {
      payloadData.thread_id_inprogress = editingDepartmentData.value.thread_id_inprogress;
      payloadData.thread_id_done = editingDepartmentData.value.thread_id_done;
    }

    const response = await api.put(`/departments/update/${editingDepartmentData.value.id}`, payloadData);

    if (response.data.success) {
      fetchDepartments();
      closeEditModal();
      Swal.fire('สำเร็จ!', 'ข้อมูลแผนกถูกแก้ไขเรียบร้อยแล้ว', 'success');
    } else {
      Swal.fire('ผิดพลาด!', response.data.message || 'ไม่สามารถแก้ไขข้อมูลแผนกได้', 'error');
    }
  } catch (error) {
    console.error('Error updating department:', error);
    Swal.fire('ผิดพลาด!', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
  }
};
</script>