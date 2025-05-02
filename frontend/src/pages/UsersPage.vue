<template>
  <AppLayout>
    <cardtitle>จัดการผู้ใช้งาน</cardtitle>
    <carddescrip>ดูแลและจัดการผู้ใช้งานในระบบ</carddescrip>
    <card>
      <cardcontent>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button>เพิ่มผู้ใช้งาน</button>
          </div>

          <div className="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4 font-medium">ชื่อผู้ใช้</th>
                  <th class="text-left py-3 px-4 font-medium">อีเมล</th>
                  <th class="text-left py-3 px-8 font-medium">บทบาท</th>
                  <th class="text-left py-3 px-4 font-medium">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="border-b hover:bg-gray-50">
                  <td class="py-3 px-4">{{ user.name }}</td>
                  <td class="py-3 px-4">{{ user.email }}</td>
                  <td class="py-3 px-4">
                    <span :class="{
                      'bg-purple-100 text-purple-700': user.role === 'ADMIN',
                      'bg-blue-100 text-blue-700': user.role === 'OFFICER',
                      'bg-green-100 text-green-700': user.role === 'USER',
                      'bg-red-100 text-red-700': user.role === 'BANNED',
                    }" class="px-3 py-1 rounded-full text-sm">
                      {{ roleName(user.role) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 space-x-2">
                    <button @click="openEdit(user)" class="border px-3 py-1 rounded">แก้ไข</button>
                    <button @click="bandUser(user.id)" class="border px-3 py-1 rounded text-red-600">ระงับ</button>
                  </td>
                </tr>

                <!-- แก้ไข role -->
                <tr v-if="editingUser" class="bg-gray-50">
                  <td colspan="5" class="px-4 py-3">
                    <div class="flex items-center gap-4">
                      <span class="font-medium">เปลี่ยนบทบาทของ {{ editingUser.name }} เป็น:</span>
                      <select v-model="selectedRole" class="border rounded px-3 py-1">
                        <option value="ADMIN">ผู้ดูแลระบบ</option>
                        <option value="OFFICER">เจ้าหน้าที่</option>
                        <option value="USER">ผู้ใช้งาน</option>
                        <option value="BANNED">ระงับบัญชี</option>
                      </select>
                      <button @click="updateRole" class="bg-blue-500 text-white px-3 py-1 rounded">บันทึก</button>
                      <button @click="cancelEdit" class="text-gray-500">ยกเลิก</button>
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
import carddescrip from '@/ui/carddescrip.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';

import { config } from '@/config';
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface User {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN' | 'OFFICER' | 'BANNED'
}

const users = ref<User[]>([])
const editingUser = ref<User | null>(null)
const selectedRole = ref('USER')

const fetchUsers = async () => {
  const res = await axios.get(`${config.apiUrl}/api/users`)
  users.value = res.data
  console.log('users: ', typeof users.value)
}

onMounted(fetchUsers)

const bandUser = async (id: number) => {
  try {
    const payload = {
      role: 'BANNED',
    }
    axios.put(`${config.apiUrl}/api/users/update/${id}`, payload)
    console.log('id: ', id)
    fetchUsers()  
  } catch (error) {
    console.error('Error banning user:', error)
  }
  {/*await axios.put(`${config.apiUrl}/api/users/${id}`, { role: 'BANNED' })
  fetchUsers() */}
}

const openEdit = (user: User) => {
  editingUser.value = user
  selectedRole.value = user.role
}

const cancelEdit = () => {
  editingUser.value = null
}

const updateRole = async () => {
  if (!editingUser.value) return
  await axios.put(`${config.apiUrl}/api/users/update/${editingUser.value.id}`, {
    role: selectedRole.value,
  })
  console.log('select Role: ',selectedRole.value)
  editingUser.value = null
  fetchUsers()
}

const roleName = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'ผู้ดูแลระบบ'
    case 'OFFICER':
      return 'เจ้าหน้าที่'
    case 'USER':
      return 'ผู้ใช้งาน'
    case 'BANNED':
      return 'ระงับบัญชี'
    default:
      return role
  }
}
</script>