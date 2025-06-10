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
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ data.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button @click="confirmDelete(data.id)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center justify-end w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      ลบแผนก
                    </button>
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

import { config } from '@/config';
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import api from '@/api/axios-instance'

interface departments {
  id: number
  name: string
}

const departments = ref<departments[]>([])

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
    reverseButtons: true,
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
  name: ''
});

// ฟังก์ชันเปิด Modal
const openAddModal = () => {
  isAddModalOpen.value = true;
};

// ฟังก์ชันปิด Modal
const closeAddModal = () => {
  isAddModalOpen.value = false;
  newDepartment.value = { name: '' }; // รีเซ็ตข้อมูล
};

// ฟังก์ชันเพิ่มประเภทใหม่
const addDepartment = async () => {
  try {
    if (!newDepartment.value.name) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    const response = await api.post(`/departments/create`, newDepartment.value);

    if (response.data) {
      fetchDepartments(); // ดึงข้อมูลใหม่
      closeAddModal(); // ปิด Modal
    } else {
      alert(response.data.message || 'เกิดข้อผิดพลาดในการสร้างแผนก');
    }
  } catch (error) {
    console.error('Error adding type:', error);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
};
</script>