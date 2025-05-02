<template>
  <AppLayout>
    <cardtitle>หน้าจัดการหมวดหมู่</cardtitle>
    <card>
      <cardcontent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button @click="openAddModal" class="border px-3 py-1 rounded bg-black/80 text-white">เพิ่มหมวดหมู่</button>

            <div v-if="isAddModalOpen" class="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/60 z-50">
              <div class="bg-white p-6 rounded-lg shadow-xl w-96 border border-gray-200">
                <h3 class="text-lg font-medium mb-4">เพิ่มหมวดหมู่</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">ชื่อหมวดหมู่ <span
                        class="text-red-500">*</span></label>
                    <input v-model="newType.name" type="text"
                      class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="กรอกชื่อหมวดหมู่" @keyup.enter="addType" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">คำอธิบาย</label>
                    <textarea v-model="newType.description"
                      class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      rows="3" placeholder="กรอกคำอธิบาย (ไม่จำเป็น)"></textarea>
                  </div>
                </div>
                <div class="mt-6 flex justify-end space-x-2">
                  <button @click="closeAddModal"
                    class="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition">
                    ยกเลิก
                  </button>
                  <button @click="addType"
                    class="px-4 py-2 rounded-md bg-black/50 text-white hover:bg-black/100 transition"
                    :disabled="!newType.name" :class="{ 'opacity-50 cursor-not-allowed': !newType.name }">
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-medium">ชื่อหมวดหมู่</th>
                  <th class="text-left py-3 px-4 font-medium">คำอธิบาย</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="data in types" :key="data.id" class="border-b hover:bg-gray-50">
                  <td class="py-3 px-4">{{ data.name }}</td>
                  <td class="py-3 px-4">{{ data.description }}</td>
                  <td class="py-3 px-4 space-x-2">
                    <button @click="deletetype(data.id)"
                      class="border px-3 py-1 rounded text-red-600">ลบหมวดหมู่</button>
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

const deletetype = async (id: number) => {
  try {
    axios.delete(`${config.apiUrl}/api/types/delete/${id}`)
    console.log('id: ', id)
    fetchTypes()
  } catch (error) {
    console.error('Error deleting type:', error) // ลบหมวดหมู่ไม่่สำเร็จ
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