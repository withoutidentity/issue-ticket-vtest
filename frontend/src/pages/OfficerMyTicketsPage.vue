<template>
  <AppLayout>
    <cardtitle>รายการแจ้งปัญหาของฉัน</cardtitle>
    <card>
      <cardcontent>
        <div class="space-y-6 overflow-y-auto overflow-x-auto truncate">
          <div v-if="isLoading" class="text-center py-4 text-gray-600">กำลังโหลดข้อมูล...</div>
          <div v-else-if="myTickets.length === 0" class="text-center py-4 text-gray-500">คุณยังไม่ได้สร้างใบงานแจ้งปัญหาใดๆ</div>
          <div v-else class="rounded-lg overflow-hidden border border-gray-200">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-left py-3 px-4 font-medium text-gray-700">เลขอ้างอิง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">หัวข้อ</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">คำอธิบาย</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">แผนก</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-700">สถานะ</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">วันที่สร้าง</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-700">ชื่อผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ticket, index) in myTickets" :key="ticket.id"
                    class="border-b align-top hover:bg-gray-50 cursor-pointer"
                    @click="goToTicket(ticket.id)">
                  <td class="py-3 px-4 text-gray-700">{{ ticket.reference_number }}</td>
                  <td class="py-3 px-4 text-gray-700 font-medium">{{ ticket.title }}</td>
                  <td class="py-3 px-4 text-gray-600 max-w-xs truncate">{{ ticket.description }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ ticket.department?.name || "-" }}</td>
                  <td class="py-3 px-4 text-center">
                    <div>
                      <span :class="statusClass(ticket.status)" class="px-3 py-1 rounded-full text-sm ">
                        {{ statusName(ticket.status) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-700">{{ formatDateDDMMYYYY(ticket.created_at) }}</td>
                  <td class="py-3 px-4 text-gray-700">{{ ticket.assignee?.name || "-" }}</td>
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
import AppLayout from "@/layouts/AppLayout.vue";
import cardtitle from '@/ui/cardtitle.vue';
import card from '@/ui/card.vue';
import cardcontent from '@/ui/cardcontent.vue';
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from 'vue-router';
import api from '@/api/axios-instance'; //Your configured axios instance

const router = useRouter();
const auth = useAuthStore();

interface User {
  id: number;
  name: string;
  email?: string;
}

interface Department {
  id?: number;
  name: string;
}

interface Assignee {
  name: string;
}

interface TicketCreatorInfo {
  id: number;
  name: string;
  email?: string;
}

interface Ticket {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed';
  created_at: string;
  updated_at: string;
  department?: Department;
  assignee?: Assignee;
  user_id: number; //ID of the user who created the ticket
  user?: TicketCreatorInfo; // The user object (name, email) from API
  // ticket_types?: { name: string; }; // Uncomment if needed
  // files?: Array<{ id: number; filename: string; filepath: string; }>; // Uncomment if needed
}

const allFetchedTickets = ref<Ticket[]>([]);
const isLoading = ref(true);

const myTickets = computed(() => {
// console.log("OfficerMyTicketsPage: myTickets computed - Evaluating.");
  if (!auth.user || typeof auth.user.id !== 'number') {
    console.warn("OfficerMyTicketsPage: myTickets - Auth user or ID invalid/missing.", { user: JSON.parse(JSON.stringify(auth.user)) });
    return [];
  }

  const officerId = auth.user.id;
// console.log(`OfficerMyTicketsPage: myTickets - Filtering for officer ID: ${officerId} (type: ${typeof officerId})`);

  if (allFetchedTickets.value.length === 0) {
    // console.log("OfficerMyTicketsPage: myTickets - allFetchedTickets is empty, returning empty array.");
    return [];
  }

  // Filter tickets where the creator's ID matches the logged-in officer's ID
  const filtered = allFetchedTickets.value.filter(ticket => {
    // Use ticket.user.id for filtering, as the API provides the user object with an ID.
    // Ensure ticket.user and ticket.user.id exist before comparing.
    const ticketCreatorId = ticket.user?.id;
    // console.log(`OfficerMyTicketsPage: myTickets - Comparing ticket ID ${ticket.id}: creator ID (from ticket.user.id) ${ticketCreatorId} (type: ${typeof ticketCreatorId}) === officer ID ${officerId} (type: ${typeof officerId}) -> ${ticketCreatorId !== undefined && String(ticketCreatorId) === String(officerId)}`);

    if (ticket.user === undefined || ticket.user.id === undefined) {
      console.warn(`OfficerMyTicketsPage: myTickets - Ticket ID ${ticket.id} has undefined user or user.id. Skipping.`);
      return false;
    }

    // Ensure comparison is robust, e.g. if one is string and other is number
    return String(ticketCreatorId) === String(officerId);
  });

  // console.log(`OfficerMyTicketsPage: myTickets - Found ${filtered.length} tickets for officer ID ${officerId}.`);
  if (filtered.length === 0 && allFetchedTickets.value.length > 0) {
      // console.log("OfficerMyTicketsPage: myTickets - No tickets matched the officer ID. Dumping first few ticket.user.id values from allFetchedTickets:");
      for (let i = 0; i < Math.min(5, allFetchedTickets.value.length); i++) {
          const t = allFetchedTickets.value[i];
          // console.log(`  Ticket ${t.id}: ticket.user.id = ${t.user?.id} (type: ${typeof t.user?.id}), creator name from ticket.user = ${t.user?.name}`);
      }
  }
  return filtered;
});

const fetchOfficerTickets = async () => {
  // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Starting.");
  isLoading.value = true;
  if (!auth.accessToken) {
    console.error("OfficerMyTicketsPage: fetchOfficerTickets - No access token found.");
    isLoading.value = false;
    return;
  }
  // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Logged in Officer ID from auth store:", auth.user?.id, "Role:", auth.user?.role);

  try {
    const response = await api.get('/tickets', {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    // console.log("OfficerMyTicketsPage: fetchOfficerTickets - API response status:", response.status);
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Sample raw ticket data from API (first ticket):", JSON.parse(JSON.stringify(response.data[0])));
        if (response.data[0].user) {
            // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Sample ticket.user object:", JSON.parse(JSON.stringify(response.data[0].user)));
            // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Sample ticket.user.id:", response.data[0].user.id, "Type:", typeof response.data[0].user.id);
        } else {
            // console.log("OfficerMyTicketsPage: fetchOfficerTickets - Sample ticket.user is undefined or null.");
        }
    } else if (response.data && Array.isArray(response.data) && response.data.length === 0) {
        // console.log("OfficerMyTicketsPage: fetchOfficerTickets - API response data is an empty array.");
    } else {
        // console.log("OfficerMyTicketsPage: fetchOfficerTickets - API response data is not an array or is empty:", response.data);
    }
    allFetchedTickets.value = response.data as Ticket[];
    // console.log(`OfficerMyTicketsPage: fetchOfficerTickets - Fetched ${allFetchedTickets.value.length} tickets in total and assigned to allFetchedTickets.`);
  } catch (err) {
    console.error("OfficerMyTicketsPage: fetchOfficerTickets - Failed to load tickets.", err);
    //Consider adding user-facing error notification here
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // console.log("OfficerMyTicketsPage: onMounted - Component mounted.");
  const initFetch = () => {
    if (auth.user && typeof auth.user.id === 'number' && auth.user.role === 'OFFICER') {
      // console.log("OfficerMyTicketsPage: initFetch - Conditions met, calling fetchOfficerTickets.", { userId: auth.user.id, role: auth.user.role });
      fetchOfficerTickets();
    } else {
      console.warn("OfficerMyTicketsPage: initFetch - Conditions NOT met for fetching.", {
        userExists: !!auth.user,
        userIdType: auth.user ? typeof auth.user.id : 'N/A',
        isUserIdNumber: auth.user ? typeof auth.user.id === 'number' : 'N/A',
        userRole: auth.user ? auth.user.role : 'N/A',
        isRoleOfficer: auth.user ? auth.user.role === 'OFFICER' : 'N/A'
      });
    }
  };

  if (auth.user && typeof auth.user.id === 'number') {
    // console.log("OfficerMyTicketsPage: onMounted - Initial user data seems present, calling initFetch.");
    initFetch();
  } else {
    // console.log("OfficerMyTicketsPage: onMounted - Initial user data not fully present or ID not a number, subscribing to auth store.", { user: JSON.parse(JSON.stringify(auth.user)) });
    //Subscribe to auth store changes in case user info is loaded asynchronously
    const unsubscribe = auth.$subscribe((_mutation, state) => {
      // console.log("OfficerMyTicketsPage: Auth store update received. New state user:", JSON.parse(JSON.stringify(state.user)));
      if (state.user && typeof state.user.id === 'number' && state.user.role === 'OFFICER') { //Added role check here too for clarity
        // console.log("OfficerMyTicketsPage: Auth store update - User data now valid for Officer, calling initFetch.");
        initFetch();
        unsubscribe(); //Unsubscribe after successful fetch trigger
      } else {
        // console.log("OfficerMyTicketsPage: Auth store update - User data still not fully meeting criteria for initFetch.");
      }
    });
  }
});

const goToTicket = (id: number) => {
  router.push(`/tickets/${id}`);
  // console.log(`Navigating to ticket ${id}`)
};

const statusName = (status: Ticket['status']): string => {
  const names: Record<Ticket['status'], string> = {
    open: "เปิด",
    in_progress: "กำลังดำเนินการ",
    pending: "รอดำเนินการ",
    closed: "เสร็จสิ้น",
  };
  return names[status] || status;
};

const statusClass = (status: Ticket['status']): object => ({
  'bg-blue-100 text-blue-700': status === 'open',
  'bg-green-100 text-green-700': status === 'in_progress',
  'bg-purple-100 text-purple-700': status === 'pending',
  'bg-red-100 text-red-700': status === 'closed',
});

const formatDateDDMMYYYY = (dateString: string | Date): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

</script>

<style scoped>
/* Add any specific styles if needed */
.max-w-xs {
  max-width: 20rem; /* Adjust as needed for description column width */
}
</style>