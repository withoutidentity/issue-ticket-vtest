<template>
  <AppLayout>
    <cardtitle>จัดการผู้ใช้งาน</cardtitle>
    <carddescrip>ดูแลและจัดการผู้ใช้งานในระบบ</carddescrip>
    <card>
      <cardcontent>
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-200">
                  <th class="text-left py-3 px-4 font-medium">ชื่อผู้ใช้</th>
                  <th class="text-left py-3 px-4 font-medium">อีเมล</th>
                  <th class="text-left py-3 px-8 font-medium">บทบาท</th>
                  <th class="text-left py-3 px-4 font-medium">แผนก</th>
                  <th class="text-left py-3 px-4 font-medium">สถานะ Officer</th>
                  <th class="text-center py-3 px-4 font-medium">การจัดการ</th>
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
                  <td class="py-3 px-4 uppercase">{{ user.department?.name || '-' }}</td>
                  <td class="py-3 px-4">
                    <span v-if="user.role === 'OFFICER'">
                      <span :class="{
                        'bg-green-100 text-green-700': user.is_officer_confirmed,
                        'bg-yellow-100 text-yellow-700': !user.is_officer_confirmed
                      }" class="px-3 py-1 rounded-full text-sm">
                        {{ user.is_officer_confirmed ? 'ยืนยันแล้ว' : 'รอการยืนยัน' }}
                      </span>
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="py-3 px-4 space-x-2 text-center">
                    <button @click="openEdit(user)" class="border px-3 py-1 rounded hover:bg-gray-100">แก้ไขบทบาท</button>
                    <button v-if="user.role === 'OFFICER' && !user.is_officer_confirmed && (auth.isAdmin || (auth.isOfficer && auth.user?.is_officer_confirmed)) && user.id !== auth.user?.id"
                            @click="confirmOfficer(user.id)"
                            class="border px-3 py-1 rounded text-green-600 hover:bg-green-50">ยืนยัน Officer</button>
                    <button @click="bandUser(user.id)" class="border px-3 py-1 rounded text-red-600 hover:bg-red-50">ระงับ</button>
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
import { useAuthStore } from '@/stores/auth';
import Swal from 'sweetalert2'
import api from '@/api/axios-instance'; // Import the pre-configured axios instance

interface User {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN' | 'OFFICER' | 'BANNED'
  is_officer_confirmed?: boolean // Optional because non-officers won't have this
  // department_id: number | ''; // Consider removing if department object is always present for officers
  department?: { // Add department object
    id: number;
    name: string;
  } | null;
}

const form = ref<User>({
  id: 0,
  name: '',
  email: '',
  role: 'USER',
  department: null, // Initialize department as null
  is_officer_confirmed: false,
})

const users = ref<User[]>([])
const editingUser = ref<User | null>(null)
const selectedRole = ref('USER')
const auth = useAuthStore(); // Access the auth store

const fetchUsers = async () => {
  try {
    // Use the pre-configured axios instance (api) which should include the auth token
    const res = await api.get(`/users`);
    users.value = res.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้', 'error');
  }
}

onMounted(fetchUsers)

const bandUser = async (id: number) => {
  const result = await Swal.fire({
    title: 'คุณแน่ใจหรือไม่?',
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
      const payload = {
        role: 'BANNED',
       };
      // Use the pre-configured axios instance (api)
      await api.put(`/users/update/${id}`, payload);
      await fetchUsers(); // Refresh the user list
      Swal.fire('สำเร็จ!', 'บัญชีถูกระงับแล้ว', 'success');
    } catch (error) {
      console.error('Error banning user:', error)
      await Swal.fire(
        'ผิดพลาด!',
        'ไม่สามารถแบนบัญชีได้: ' + error.message,
        'error'
      )
    }
    {/*await axios.put(`${config.apiUrl}/api/users/${id}`, { role: 'BANNED' })
  fetchUsers() */}
  }
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
  try {
    // Use the pre-configured axios instance (api)
    await api.put(`/users/update/${editingUser.value.id}`, {
      role: selectedRole.value,
    });
    editingUser.value = null;
    await fetchUsers(); // Refresh the user list
    Swal.fire('สำเร็จ!', 'บทบาทถูกปรับปรุงแล้ว', 'success');
  } catch (error) {
    console.error('Error updating role:', error);
    Swal.fire('ผิดพลาด!', 'ไม่สามารถปรับปรุงบทบาทได้', 'error');
  }
};

const confirmOfficer = async (userId: number) => {
  const result = await Swal.fire({
    title: 'ยืนยัน Officer?',
    text: "คุณต้องการยืนยันผู้ใช้งานคนนี้ให้เป็น Officer หรือไม่?",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      // Use the pre-configured axios instance (api)
      const response = await api.patch(`/users/${userId}/confirm-officer`);
      const updatedOfficerData = response.data.user; // Assuming API returns the updated user

      const userIndex = users.value.findIndex(u => u.id === userId);
      if (userIndex !== -1 && updatedOfficerData) {
        // Update the user in the local array to trigger reactivity
        // Creating a new object for the specific user ensures reactivity
        users.value[userIndex] = { ...users.value[userIndex], ...updatedOfficerData };
        // Forcing a re-render of the list if needed, though updating the item should be enough
        // users.value = [...users.value];
      } else {
        // Fallback to fetching all users if specific update fails or data is not returned
        await fetchUsers();
      }
      Swal.fire('สำเร็จ!', 'Officer ได้รับการยืนยันแล้ว', 'success');
    } catch (error) {
      console.error('Error confirming officer:', error.response || error);
      const errorMessage = error.response?.data?.error || // พยายามดึงข้อความ error จาก backend response
                           error.message || // หรือใช้ error message ทั่วไปของ JavaScript
                           'ไม่สามารถยืนยัน Officer ได้'; // ข้อความ fallback
      Swal.fire('ผิดพลาด!', errorMessage, 'error');
    }
  }
};

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