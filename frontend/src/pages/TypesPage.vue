<template>
  <AppLayout>
    <cardtitle>หน้าจัดการหมวดหมู่</cardtitle>
    <card>
      <cardcontent>
        <div class="space-y-6">
          <!-- ส่วนหัวกับปุ่มเพิ่ม -->
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">รายการหมวดหมู่ทั้งหมด</h2>
            <button 
              @click="openAddModal" 
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              เพิ่มหมวดหมู่
            </button>
          </div>

          <!-- Modal เพิ่มหมวดหมู่ -->
          <div v-if="isAddModalOpen" class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/60 z-50">
            <div class="bg-white p-6 rounded-xl shadow-xl w-96 border border-gray-200">
              <h3 class="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มหมวดหมู่
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่ <span class="text-red-500">*</span></label>
                  <input 
                    v-model="newType.name" 
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอกชื่อหมวดหมู่" 
                    @keyup.enter="addType" 
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย<span class="text-red-500">*</span></label>
                  <textarea
                    v-model="newType.description" 
                    type="text" rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="กรอกคำอธิบาย" 
                    @keyup.enter="addType">
                  </textarea>
                  
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button 
                  @click="closeAddModal"
                  class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button 
                  @click="addType"
                  class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                  :disabled="!newType.name" 
                  :class="{ 'opacity-50 cursor-not-allowed': !newType.name }"
                >
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
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อหมวดหมู่</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำอธิบาาย</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="data in types" :key="data.id" class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ data.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ data.description }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      @click="confirmDelete(data.id)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center justify-end w-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      ลบหมวดหมู่
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

interface ticket_types {
  id: number
  name: string
  description: string
}

const types = ref<ticket_types[]>([])
// const editingUser = ref<ticket_types | null>(null)
// const selectedRole = ref('USER')

const fetchTypes = async () => {
  const res = await axios.get(`${config.apiUrl}/api/types`)
  types.value = res.data.data
}

onMounted(fetchTypes)

// const deletetype = async (id: number) => {
//   try {
//     axios.delete(`${config.apiUrl}/api/types/delete/${id}`)
//     console.log('id: ', id)
//     fetchTypes()
//   } catch (error) {
//     console.error('Error deleting type:', error) // ลบหมวดหมู่ไม่่สำเร็จ
//   }
// }

const confirmDelete = async (id: number) => {
  const result = await Swal.fire({
    title: 'คุณแน่ใจหรือไม่?',
    text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
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
        const { data } = await axios.get(`${config.apiUrl}/api/types/check/${id}`);
        if (data.isUsed) {
          await Swal.fire(
            'ผิดพลาด!',
            'ข้อมูลนี้ถูกใช้งานอยู่ในระบบ ไม่สามารถลบได้',
            'error'
          )
        } else {
          axios.delete(`${config.apiUrl}/api/types/delete/${id}`)
          console.log('delete type id: ', id)
          await Swal.fire(
            'ลบแล้ว!',
            'รายการของคุณถูกลบเรียบร้อยแล้ว',
            'success'
          )
        }

        fetchTypes()
      } catch (error) {
        console.error('Error deleting type:', error) // ลบหมวดหมู่ไม่่สำเร็จ
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
const newType = ref({
  name: '',
  description: ''
});

// ฟังก์ชันเปิด Modal
const openAddModal = () => {
  isAddModalOpen.value = true;
};

// ฟังก์ชันปิด Modal
const closeAddModal = () => {
  isAddModalOpen.value = false;
  newType.value = { name: '', description: '' }; // รีเซ็ตข้อมูล
};

// ฟังก์ชันเพิ่มประเภทใหม่
const addType = async () => {
  try {
    if (!newType.value.name) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    const response = await axios.post(`${config.apiUrl}/api/types/create`, newType.value);

    if (response.data.success) {
      fetchTypes(); // ดึงข้อมูลใหม่
      closeAddModal(); // ปิด Modal
    } else {
      alert(response.data.message || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
    }
  } catch (error) {
    console.error('Error adding type:', error);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
};
</script>