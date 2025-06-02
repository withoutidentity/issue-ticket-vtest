<template>
  <AppLayout>
    <card>
      <cardcontent>
        <div class="flex items-center justify-between mb-4">
          <div class="flex flex-col">
            <cardtitle>จัดการผู้ใช้งาน</cardtitle>
            <p class="text-sm text-gray-600 font-medium ml-3">
              ผู้ใช้งานทั้งหมด:
              <span class="text-blue-600 font-semibold">{{ users.length }}</span>
            </p>
          </div>
          <div class="flex items-center">
            <div class="flex items-center space-x-3">
              <!-- Search box -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input type="text" v-model="searchQueryUsers"
                  class="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  placeholder="ค้นหาชื่อ, อีเมล, บทบาท..." />
              </div>

              <!-- Department Filter Dropdown -->
              <div class="relative" ref="departmentFilterDropdownRef">
                <button @click="toggleDepartmentFilterDropdown"
                  class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm cursor-pointer text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                    <!-- Filter Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-1.414.914l-2-1A1 1 0 0110 19.414V13.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>
                <div v-if="isDepartmentFilterDropdownOpen"
                     class="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 right-0 max-h-60 overflow-y-auto">
                  <ul class="py-1">
                    <li @click="selectDepartmentFilter(null)" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">แผนกทั้งหมด</li>
                    <li v-for="dept in departmentsList" :key="dept.id" @click="selectDepartmentFilter(dept.id)"
                        class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      {{ dept.name }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Reset button -->
              <button @click="resetUserFilters"
                class="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg shadow-sm text-gray-700 cursor-pointer bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Items per page -->
        <div class="flex items-center space-x-2 mt-4 md:mt-0 justify-start md:justify-end col-span-1 md:col-span-2 lg:col-span-1">
          <label for="perPageUsersInput" class="text-sm text-gray-600">แสดง:</label>
          <input id="perPageUsersInput" type="number" min="1" v-model.number="perPageUsers"
            class="w-12 px-2 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
          <span class="text-sm text-gray-600">รายการต่อหน้า</span>
        </div>

        <div className="space-y-6 overflow-x-auto">
          <div class="mt-3 rounded-lg overflow-hidden overflow-x-auto border border-gray-200">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-left py-3 px-4 font-medium">ชื่อผู้ใช้</th>
                  <th class="text-left py-3 px-4 font-medium">อีเมล</th>
                  <th class="text-left py-3 px-8 font-medium">บทบาท</th>
                  <th class="text-left py-3 px-4 font-medium">แผนก</th>
                  <th class="text-left py-3 px-4 font-medium">สถานะ Officer</th>
                  <th class="text-center py-3 px-4 font-medium">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in paginatedUsers" :key="user.id" class="text-sm border-gray-700/25 border-b hover:bg-gray-50">
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
                  <td class="py-3 px-4 space-x-1 text-center">
                    <button @click="openEdit(user)"
                      class="p-2 rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-150"
                      title="แก้ไขบทบาท">
                      <span class="material-icons text-lg">edit</span>
                    </button>
                    <button
                      v-if="user.role === 'OFFICER' && !user.is_officer_confirmed && (auth.isAdmin || (auth.isOfficer && auth.user?.is_officer_confirmed)) && user.id !== auth.user?.id"
                      @click="confirmOfficer(user.id)"
                      class="p-2 rounded-full hover:bg-green-100 text-green-600 hover:text-green-800 transition-colors duration-150"
                      title="ยืนยัน Officer">
                      <span class="material-icons text-lg">how_to_reg</span>
                    </button>
                    <button @click="bandUser(user.id)"
                      class="p-2 rounded-full hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors duration-150"
                      title="ระงับบัญชี">
                      <span class="material-icons text-lg">block</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Pagination Controls -->
        <div v-if="totalPagesUsers > 1" class="mt-6 flex justify-between items-center">
            <button @click="prevPageUsers" :disabled="currentPageUsers === 1"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ก่อนหน้า
            </button>
            <span class="text-sm text-gray-700">
              หน้า {{ currentPageUsers }} จาก {{ totalPagesUsers }}
            </span>
            <button @click="nextPageUsers" :disabled="currentPageUsers === totalPagesUsers"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ถัดไป
            </button>
        </div>

      </cardcontent>

      <!-- Edit Role Modal -->
      <div v-if="isEditModalOpen && editingUser"
        class="fixed inset-0 backdrop-blur-sm bg-black/60 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
        <div class="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg leading-6 font-medium text-gray-900 text-center mb-4">แก้ไขบทบาทสำหรับ: <span class="font-semibold">{{ editingUser.name }}</span></h3>
            <div class="mt-2 px-7 py-3">
              <label for="roleSelectModal" class="block text-sm font-medium text-gray-700 text-left mb-1">บทบาท:</label>
              <select id="roleSelectModal" v-model="selectedRole" class="w-full border border-gray-300 rounded px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="ADMIN">ผู้ดูแลระบบ</option>
                <option value="OFFICER">เจ้าหน้าที่</option>
                <option value="USER">ผู้ใช้งาน</option>
                <option value="BANNED">ระงับบัญชี</option>
              </select>
            </div>
            <div class="flex items-center justify-end px-4 py-3 space-x-3">
              <button @click="closeEditModal" type="button"
                      class="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
                ยกเลิก
              </button>
              <button @click="updateRole" type="button"
                      class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
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

interface DepartmentListItem {
  id: number;
  name: string;
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

const searchQueryUsers = ref('');
const selectedDepartmentFilter = ref<number | null>(null);
const perPageUsers = ref(10);
const currentPageUsers = ref(1);
const departmentsList = ref<DepartmentListItem[]>([]);
const isEditModalOpen = ref(false);

const isDepartmentFilterDropdownOpen = ref(false);
const departmentFilterDropdownRef = ref<HTMLElement | null>(null);

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

const fetchDepartmentsList = async () => {
  try {
    const res = await api.get(`/departments`); // Assuming this endpoint returns all departments
    departmentsList.value = res.data as DepartmentListItem[];
  } catch (error) {
    console.error('Failed to fetch departments list:', error);
    // departmentsList.value = []; // Or handle error appropriately
  }
};

const filteredAndSearchedUsers = computed(() => {
  let filtered = [...users.value];

  // Filter by department
  if (selectedDepartmentFilter.value !== null) {
    filtered = filtered.filter(user => user.department?.id === selectedDepartmentFilter.value);
  }

  // Filter by search query (name, email, role)
  if (searchQueryUsers.value.trim() !== '') {
    const lowerSearchQuery = searchQueryUsers.value.toLowerCase();
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(lowerSearchQuery) ||
      user.email.toLowerCase().includes(lowerSearchQuery) ||
      roleName(user.role).toLowerCase().includes(lowerSearchQuery)
    );
  }
  return filtered;
});

const totalPagesUsers = computed(() => {
  if (perPageUsers.value <= 0) return 1;
  return Math.ceil(filteredAndSearchedUsers.value.length / perPageUsers.value);
});

const paginatedUsers = computed(() => {
  const start = (currentPageUsers.value - 1) * perPageUsers.value;
  const end = start + perPageUsers.value;
  return filteredAndSearchedUsers.value.slice(start, end);
});

onMounted(() => {
  fetchUsers();
  fetchDepartmentsList();
  document.addEventListener('click', handleClickOutsideDepartmentFilter);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideDepartmentFilter);
});

watch([searchQueryUsers, selectedDepartmentFilter, perPageUsers], () => {
  currentPageUsers.value = 1;
});


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
  editingUser.value = { ...user }; // Clone user object to avoid direct mutation if cancelled
  selectedRole.value = user.role;
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingUser.value = null;
  // Optionally reset selectedRole if needed, e.g., selectedRole.value = 'USER';
};

const updateRole = async () => {
  if (!editingUser.value) return;
  try {
    // Use the pre-configured axios instance (api)
    await api.put(`/users/update/${editingUser.value.id}`, {
      role: selectedRole.value,
    });
    // editingUser.value = null; // This will be handled by closeEditModal
    await fetchUsers(); // Refresh the user list
    Swal.fire('สำเร็จ!', 'บทบาทถูกปรับปรุงแล้ว', 'success');
    closeEditModal(); // Close modal on successful update
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
};

const toggleDepartmentFilterDropdown = () => {
  isDepartmentFilterDropdownOpen.value = !isDepartmentFilterDropdownOpen.value;
};

const selectDepartmentFilter = (departmentId: number | null) => {
  selectedDepartmentFilter.value = departmentId;
  isDepartmentFilterDropdownOpen.value = false;
};

const handleClickOutsideDepartmentFilter = (event: MouseEvent) => {
  if (departmentFilterDropdownRef.value && !departmentFilterDropdownRef.value.contains(event.target as Node)) {
    isDepartmentFilterDropdownOpen.value = false;
  }
};

const resetUserFilters = () => {
  searchQueryUsers.value = '';
  selectedDepartmentFilter.value = null;
  perPageUsers.value = 10;
  currentPageUsers.value = 1;
};

const nextPageUsers = () => {
  if (currentPageUsers.value < totalPagesUsers.value) currentPageUsers.value++;
};

const prevPageUsers = () => {
  if (currentPageUsers.value > 1) currentPageUsers.value--;
};
</script>