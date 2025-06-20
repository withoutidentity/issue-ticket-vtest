// stores/ticketStore.ts
import { defineStore } from 'pinia';
import api from '@/api/axios-instance'; // สมมติว่าคุณมี instance ของ axios ที่ตั้งค่าไว้แล้ว
import { useAuthStore } from './auth'; 
import { Ticket } from '@/types/ticket'
import { FileInfo } from '@/types/ticket'
export const useTicketStore = defineStore('ticket', {
  state: () => ({
    tickets: [] as Ticket[],
    loading: false,
    error: null as any, // หรือกำหนด type ของ error ที่ชัดเจน
  }),
  actions: {
    // Modify fetchTickets to accept a filters object
    async fetchTickets(filters: { visibility?: 'active' | 'hidden' | 'all' } = {}) {
      this.loading = true;
      this.error = null;
      const auth = useAuthStore(); // เรียกใช้ auth store
      try {
        const params = new URLSearchParams();
        if (filters.visibility) {
          params.append('visibility', filters.visibility);
        }
        // Ensure params are included in the API call URL
        const response = await api.get(`/tickets?${params.toString()}`, { 
          headers: {
            Authorization: `Bearer ${auth.accessToken || localStorage.getItem('accessToken')}`, // เลือกใช้ token ที่เหมาะสม
          },
        });
        this.tickets = response.data as Ticket[]; // อัปเดต state tickets
      } catch (err) {
        console.error("Failed to load tickets in store:", err);
        this.error = err;
        this.tickets = []; // อาจจะเคลียร์ tickets เมื่อเกิด error
      } finally {
        this.loading = false; // สิ้นสุดการ loading
      }
    },
    // ... actions อื่นๆ (ถ้ามี)
  },
});
