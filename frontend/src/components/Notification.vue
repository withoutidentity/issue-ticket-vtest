<template>
  <div class="relative" ref="dropdownRef">
    <!-- ปุ่มกดเปิด dropdown -->
    <button @click="toggleDropdown" class="relative">
      <!-- ไอคอน notifications เด้งเมื่อมีแจ้งเตือน -->
      <span
        class="material-symbols-outlined text-2xl mr-2 text-gray-700 transition-transform duration-300 cursor-pointer"
        :class="unreadCount > 0 ? 'text-red-500 scale-110 animate-bounce' : ''"
      >
        notifications
      </span>

      <!-- ตัวเลขแจ้งเตือนยังไม่อ่าน กระพริบ -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center shadow animate-pulse"
      >
        {{ unreadCount }}
      </span>
    </button>

    <!-- กล่อง dropdown การแจ้งเตือน -->
    <transition name="fade-slide">
      <div
        v-if="showDropdown"
        class="absolute mt-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 z-50 w-[calc(100vw-2rem)] max-w-sm right-1/2 mr-10 sm:mr-12 md:mr-0 translate-x-1/2 md:w-72 md:max-w-none md:right-0 md:translate-x-0"
      >
        <h3 class="text-sm font-semibold mb-2">การแจ้งเตือน</h3>

        <div v-if="notifications.length > 0" class="max-h-60 overflow-y-auto space-y-2">
          <!-- 🔹 กลุ่ม: วันนี้ -->
          <template v-if="groupNotificationsByDay().today.length > 0">
            <p class="text-xs text-gray-400 px-2">วันนี้</p>
            <ul>
              <li
                v-for="(noti, index) in groupNotificationsByDay().today"
                :key="noti.id"
                class="p-2 rounded cursor-pointer transition hover:bg-gray-100"
                :class="[
                  !noti.read ? 'bg-blue-50' : '',
                  'animate-fadeInUp'
                ]"
                :style="{ animationDelay: `${index * 80}ms` }"
                @click="goToTicket(noti)"
              >
                <p class="text-sm flex items-center gap-2">
                  <span :class="`material-symbols-outlined text-base ${getIconColor(noti.type, noti.message)}`">
                    {{ getIcon(noti.type) }}
                  </span>
                  <span>{{ noti.message }}</span>
                  <span class="text-[11px] text-gray-400" v-if="noti.ticketCode">({{ noti.ticketCode }})</span>
                </p>

                <span class="text-xs text-gray-500">{{ timeAgo(noti.timestamp) }}</span>
              </li>
            </ul>
          </template>

          <!-- 🔹 กลุ่ม: ก่อนหน้านี้ -->
          <template v-if="groupNotificationsByDay().earlier.length > 0">
            <p class="text-xs text-gray-400 px-2 pt-2">ก่อนหน้านี้</p>
            <ul>
              <li
                v-for="(noti, index) in groupNotificationsByDay().earlier"
                :key="noti.id"
                class="p-2 rounded cursor-pointer transition hover:bg-gray-100"
                :class="[
                  !noti.read ? 'bg-blue-50' : '',
                  'animate-fadeInUp'
                ]"
                :style="{ animationDelay: `${index * 80}ms` }"
                @click="goToTicket(noti)"
              >
                <p class="text-sm flex items-center gap-2">
                  <span :class="`material-symbols-outlined text-base ${getIconColor(noti.type, noti.message)}`">
                    {{ getIcon(noti.type) }}
                  </span>
                  <span>{{ noti.message }}</span>
                  <span class="text-[11px] text-gray-400" v-if="noti.ticketCode">({{ noti.ticketCode }})</span>
                </p>
                <span class="text-xs text-gray-500">{{ timeAgo(noti.timestamp) }}</span>
              </li>
            </ul>
          </template>
        </div>

        <!-- ไม่มีการแจ้งเตือน -->
        <p v-else class="text-sm text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import api from '@/api/axios-instance';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// import { useToast } from "vue-toastification"
import { useAuthStore } from '@/stores/auth'; // Import auth store
import { useRouter } from 'vue-router';

import { io, Socket } from 'socket.io-client';



const socket = io('https://issue-ticket.hopto.org'); // ใช้ URL server จริงตอน deploy

// const toast = useToast()
const showDropdown = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const dropdownRef = ref(null)

const auth = useAuthStore(); // Initialize auth store
const currentUserId = computed(() => auth.user?.id);
const currentUserRole = computed(() => auth.user?.role);

const router = useRouter()
const LAST_CLEARED_TIMESTAMP_KEY_PREFIX = 'notificationsLastClearedTimestamp_';

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  // if (showDropdown.value) { // 🗑️ ลบการเรียก markUnreadAsRead() เดิมออก
  //   markUnreadAsRead()
  // }
  if (showDropdown.value) {
    // เมื่อเปิด dropdown, ทำให้ badge ตัวเลขหายไป โดยตั้ง unreadCount เป็น 0 ชั่วคราวสำหรับการแสดงผล
    unreadCount.value = 0;

    // เก็บ timestamp ของการแจ้งเตือนล่าสุด (หรือเวลาปัจจุบันถ้าไม่มี) เพื่อใช้เป็นจุดอ้างอิงว่าเคลียร์ badge ถึงเมื่อไหร่
    if (currentUserId.value) {
      let latestTimestamp = new Date().toISOString();
      if (notifications.value.length > 0) {
        // Sort by timestamp descending to get the newest
        const sortedNotifications = [...notifications.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        latestTimestamp = sortedNotifications[0].timestamp;
      }
      localStorage.setItem(LAST_CLEARED_TIMESTAMP_KEY_PREFIX + currentUserId.value, latestTimestamp);
    }
  } else {
    // เมื่อปิด dropdown, คำนวณ unreadCount ใหม่ตามจำนวนที่ยังไม่อ่านจริง
    // เพื่อให้ badge แสดงผลถูกต้องหากผู้ใช้ปิดไปโดยไม่ได้อ่าน item ใดๆ
    // การคำนวณนี้จะเคารพ lastClearedTimestamp ผ่าน calculateUnreadCountForBadge
    unreadCount.value = calculateUnreadCountForBadge(notifications.value);
  }
}

function groupNotificationsByDay() {
  const today = new Date().toDateString()
  const grouped = { today: [], earlier: [] }

  for (const noti of notifications.value) {
    const notiDate = new Date(noti.timestamp).toDateString()
    if (notiDate === today) {
      grouped.today.push(noti)
    } else {
      grouped.earlier.push(noti)
    }
  }

  return grouped
}

// Helper function to calculate unread count for the badge, respecting the last cleared timestamp
function calculateUnreadCountForBadge(notificationsArray) {
  if (!currentUserId.value) {
    return notificationsArray.filter(n => !n.read).length; // Fallback if no user ID
  }
  const lastClearedTsString = localStorage.getItem(LAST_CLEARED_TIMESTAMP_KEY_PREFIX + currentUserId.value);

  if (lastClearedTsString) {
    const lastClearedDate = new Date(lastClearedTsString);
    return notificationsArray.filter(n => !n.read && new Date(n.timestamp) > lastClearedDate).length;
  } else {
    return notificationsArray.filter(n => !n.read).length; // No timestamp stored, count all unread
  }
}

async function fetchNotifications() {
  try {
    const res = await api.get(`/notifications`)
    notifications.value = res.data.map(n => ({
      id: n.id,
      message: n.message,
      ticketId: n.ticket_id,
      ticketCode: n.ticketCode || '',
      timestamp: n.created_at,
      read: n.is_read,
      type: n.type
    }))
    unreadCount.value = calculateUnreadCountForBadge(notifications.value);
  } catch (err) {
    console.error('โหลดแจ้งเตือนไม่ได้:', err)
  }
}


async function checkDoneNotifications() {
  if (!currentUserId.value) {
    console.warn("Cannot check done notifications, userId not available from auth store.");
    return;
  }
  try {
    const res = await api.get(`/notifications/check-done/${currentUserId.value}`)
    if (res.data.notify) {
      await fetchNotifications(); // เรียก fetchNotifications เพื่ออัปเดต list เต็ม
    }
  } catch (err) {
    console.error('ตรวจสอบแจ้งเตือน done ไม่สำเร็จ:', err)
  }
}

async function checkInProgressNotifications() {
  if (!currentUserId.value) {
    console.warn("Cannot check in-progress notifications, userId not available from auth store.");
    return;
  }
  try {
    const res = await api.get(`/notifications/check-inprogress/${currentUserId.value}`)
    if (res.data.notify) {
      await fetchNotifications(); // เรียก fetchNotifications เพื่ออัปเดต list เต็ม
    }
  } catch (err) {
    console.error('ตรวจสอบแจ้งเตือน in_progress ไม่สำเร็จ:', err)
  }
}


async function checkOpenNotifications(){
  try{
    const res = await api.get(`/notifications/check-open`)
    // The /check-open for OFFICER/ADMIN now returns the notifications directly
    // if (res.data.notify && res.data.notifications && res.data.notifications.length > 0) {
    //   // Process res.data.notifications and merge them into the local notifications.value
    //   // This part might need more sophisticated merging logic if called frequently
    // }
    await fetchNotifications(); // Or simply refetch all for simplicity after check
  }catch (err) {
    console.error('ตรวจสอบเเจ้งเตือน open ไม่สำเร็จ:', err)
  }
}

function getIcon(type) {
  switch (type) {
    case 'open_ticket_alert': return 'brightness_1'
    case 'in_progress_alert': return 'brightness_1'
    case 'done_alert': return 'brightness_1'
    case 'ADMIN_TICKET_CREATED': return 'brightness_1'
    case 'ADMIN_STATUS_CHANGED': return 'brightness_1'
    default: return 'brightness_1'
  }
}

function getIconColor(type, message) {
  switch (type) {
    case 'open_ticket_alert': return 'text-red-500'
    case 'in_progress_alert': return 'text-yellow-500'
    case 'done_alert': return 'text-green-500'
    case 'ADMIN_TICKET_CREATED': return 'text-red-500'
    case 'ADMIN_STATUS_CHANGED': 
      return message?.includes("กำลังดำเนินการ") ? 'text-yellow-500' : 'text-green-500'
  }
}
// function getIconColor(notificationItem) {
//   const type = notificationItem.type;
//   const message = notificationItem.message || "";

//   if (type == "ADMIN_TICKET_CREATED" || type == "open_ticket_alert") {
//     console.log('🔴 Returning red for ADMIN_TICKET_CREATED or open_ticket_alert');
//     return 'text-red-500'; // 🔴
//   }
//   if (type == "in_progress_alert" || (type == "ADMIN_STATUS_CHANGED" && (message.includes("กำลังดำเนินการ")))) {
//     console.log('🟡 Returning yellow for in_progress_alert or ADMIN_STATUS_CHANGED with in_progress');
//     return 'text-yellow-500'; // 🟡
//   }
//   if (type == "done_alert" || (type == "ADMIN_STATUS_CHANGED" && (message.includes("เสร็จสิ้น")))) {
//     console.log('🟢 Returning green for done_alert or ADMIN_STATUS_CHANGED with done');
//     return 'text-green-500'; // 🟢
//   }
//   return 'text-blue-500';
// }

function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return 'เมื่อครู่นี้';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;
  if (weeks < 4) return `${weeks} สัปดาห์ที่แล้ว`;
  if (months < 12) return `${months} เดือนที่แล้ว`;
  return `${years} ปีที่แล้ว`;
}

  async function goToTicket(notificationItem) {
  // Mark this specific notification as read if it's not already
  if (!notificationItem.read) {
    try {
      await api.post(`/notifications/mark-read/${notificationItem.id}`);
      // Find the notification in the local array and update its 'read' status
      const notiInArray = notifications.value.find(n => n.id === notificationItem.id);
      if (notiInArray) {
        notiInArray.read = true;
      }
      // Recalculate unread count
      unreadCount.value = calculateUnreadCountForBadge(notifications.value);
    } catch (err) {
      console.error(`Failed to mark notification ${notificationItem.id} as read:`, err);
      // Continue navigation even if marking as read fails
    }
  }
  showDropdown.value = false; // Close dropdown
  router.push(`/tickets/${notificationItem.ticketId}`); // Navigate to the ticket
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(async () => { // ทำให้ onMounted เป็น async
  document.addEventListener('click', handleClickOutside);

  // ฟัง event จาก WebSocket
  socket.on('connect', () => {
    console.log('WebSocket connected:', socket.id);
    if (currentUserId.value) {
      socket.emit('register', currentUserId.value); // ใช้ 'register' และ userId จาก store
    } else {
      // ถ้า currentUserId ยังไม่พร้อม (เช่น auth store กำลังโหลด) ให้ watch
      const unwatchUserId = watch(currentUserId, (newVal) => {
        if (newVal && socket.connected) {
          socket.emit('register', newVal);
          unwatchUserId(); // หยุด watch เมื่อส่ง register แล้ว
        }
      });
    }
  });

  // Watch for auth state and currentUserId to be ready before fetching initial data and starting polling
  const unwatchAuthAndUser = watch(
    [() => auth.isAuthenticated, currentUserId], // Watch an array of sources
    async ([isAuth, userId]) => {
      if (isAuth && userId) {
        console.log(`Notification.vue: Auth is ready (isAuthenticated: ${isAuth}, userId: ${userId}). Fetching initial notifications and starting polling.`);
        
        // Fetch initial notifications
        await fetchNotifications();

        // Start initial polling
        if (currentUserRole.value) { // Ensure role is also available for polling logic
          runInitialPolling();
        }

        unwatchAuthAndUser(); // Stop watching after successful execution
      } else {
        console.warn(`Notification.vue: Waiting for auth/user. isAuthenticated: ${isAuth}, userId: ${userId}`);
      }
    },
    { immediate: true } // immediate: true to check on component mount
  );

  // ฟังเมื่อมีแจ้งเตือนใหม่ส่งมาจาก backend
  socket.on('notification:new', (newNotiData) => {
    // Log a deep copy to avoid issues with console displaying later states of the object
    console.log('🔔 WebSocket notification:new received:', JSON.parse(JSON.stringify(newNotiData)));
    console.log(`Current User ID: ${currentUserId.value}, Current User Role: ${currentUserRole.value}`);

    // Basic validation of the incoming data
    if (!newNotiData || !newNotiData.db_notification_id || !newNotiData.type || !newNotiData.message) {
      console.warn('Incomplete WebSocket notification data. Skipping.', newNotiData);
      return;
    }

    let shouldDisplay = false;
    let reason = "Initial value"; // For debugging

    if (currentUserRole.value === 'USER') {
      // USER เห็นเฉพาะ in_progress_alert หรือ done_alert ของตัวเอง
      if (newNotiData.userId === currentUserId.value &&
          (newNotiData.type === 'in_progress_alert' || newNotiData.type === 'done_alert')) {
        shouldDisplay = true;
        reason = "USER role, matching userId and type.";
      } else {
        reason = `USER role, but condition not met: incoming userId (${newNotiData.userId}) vs currentUserId (${currentUserId.value}), or type (${newNotiData.type}) is not in_progress_alert/done_alert.`;
      }
    } else if (currentUserRole.value === 'OFFICER') {
      // OFFICER เห็น open_ticket_alert (คาดว่า backend จะส่งมาเมื่อมี ticket ใหม่)
      if (newNotiData.type === 'open_ticket_alert') {
        shouldDisplay = true;
        reason = "OFFICER role, type is open_ticket_alert.";
      }
      // เพิ่มเติม: OFFICER อาจจะอยากเห็นการอัปเดตของ ticket ที่ตัวเอง assigned ด้วย
      // if (newNotiData.assigneeId === currentUserId.value && (newNotiData.type === 'in_progress_alert' || newNotiData.type === 'done_alert')) {
      //   shouldDisplay = true;
      //   reason = "OFFICER role, assigned to ticket and type is in_progress_alert/done_alert.";
      // }
      else {
        reason = `OFFICER role, but type (${newNotiData.type}) is not open_ticket_alert (or other OFFICER conditions not met).`;
      }
    } else if (currentUserRole.value === 'ADMIN') {
      // ADMIN อาจจะเห็นการแจ้งเตือนหลายประเภท
      if (newNotiData.type === 'ADMIN_TICKET_CREATED' || // แจ้งเตือน Ticket ใหม่สำหรับ Admin
          newNotiData.type === 'ADMIN_STATUS_CHANGED' || // แจ้งเตือนการเปลี่ยนสถานะสำหรับ Admin
          newNotiData.type === 'open_ticket_alert' || // ยังคงรับ open_ticket_alert (ถ้ามีกรณีที่ส่งมา)
          newNotiData.type === 'in_progress_alert' || newNotiData.type === 'done_alert') { // และการแจ้งเตือนสถานะทั่วไป
        shouldDisplay = true;
        reason = "ADMIN role, type matches allowed types.";
      } else {
        reason = `ADMIN role, but type (${newNotiData.type}) not in allowed list.`;
      }
    } else {
      reason = `No matching role, or currentUserRole.value is undefined/null: ${currentUserRole.value}`;
    }

    console.log(`[Notification Processing] Should display: ${shouldDisplay}. Reason: ${reason}`);

    if (shouldDisplay) {
      const existingIndex = notifications.value.findIndex(n => n.id === newNotiData.db_notification_id);

      if (existingIndex !== -1) {
        // ถ้ามีอยู่แล้ว ให้อัปเดตข้อมูล (เช่น สถานะการอ่าน, ข้อความ)
        const existingNoti = notifications.value[existingIndex];
        if (existingNoti.read !== newNotiData.db_is_read) {
          existingNoti.read = newNotiData.db_is_read;
        }
        existingNoti.message = newNotiData.message; // อัปเดต message เผื่อมีการเปลี่ยนแปลง
        existingNoti.timestamp = newNotiData.db_created_at || newNotiData.timestamp || new Date().toISOString(); // อัปเดต timestamp
        console.log(`[Notification Update] Notification ${newNotiData.db_notification_id} updated in the list.`);
      } else {
        // ถ้าเป็นการแจ้งเตือนใหม่ ให้เพิ่มเข้าไปใน list ด้านบนสุด
        notifications.value.unshift({
          id: newNotiData.db_notification_id,
          message: newNotiData.message,
          ticketId: newNotiData.ticketId,
          ticketCode: newNotiData.ticketCode || '',
          timestamp: newNotiData.db_created_at || newNotiData.timestamp || new Date().toISOString(),
          read: newNotiData.db_is_read || false,
          type: newNotiData.type,
        });
        console.log(`[Notification Add] Notification ${newNotiData.db_notification_id} added to the list.`);
      }
      // เรียงลำดับการแจ้งเตือนใหม่ตามเวลา (ใหม่สุดไปเก่าสุด)
      notifications.value.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      // อัปเดตจำนวนที่ยังไม่อ่าน
      unreadCount.value = calculateUnreadCountForBadge(notifications.value);
    } else {
      // Log นี้มีอยู่แล้ว แต่เพิ่ม context ให้ชัดเจน
      console.log('[Notification Skip] Notification not relevant for current user/role or filtered out by shouldDisplay logic.', JSON.parse(JSON.stringify(newNotiData)));
    }
  });

  // เรียก API polling หลังจาก auth store น่าจะพร้อมแล้ว
  const runInitialPolling = () => {
    // ตรวจสอบให้แน่ใจว่า currentUserId และ currentUserRole มีค่าก่อนเรียก polling
    if (currentUserId.value && currentUserRole.value) {
      console.log(`Notification.vue: Running initial polling for user ${currentUserId.value}, role ${currentUserRole.value}`);
      if (currentUserRole.value === 'OFFICER' || currentUserRole.value === 'ADMIN') {
        checkOpenNotifications();
      } else if (currentUserRole.value === 'USER') {
        checkInProgressNotifications();
        checkDoneNotifications();
      }
    }else {
      console.warn('Notification.vue: Cannot run initial polling, userId or role not available.');
    }
  };
  // 🗑️ The call to runInitialPolling is now handled by the combined watch above.
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  socket.disconnect()
})
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Animation รายการแจ้งเตือนค่อยๆ เลื่อนขึ้นพร้อมจาง */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeInUp {
  animation: fadeInUp 0.4s ease forwards;
}

/* animate-bounce และ animate-pulse มาจาก Tailwind CSS */
</style>
