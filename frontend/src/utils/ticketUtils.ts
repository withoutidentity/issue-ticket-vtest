// src/utils/ticketUtils.ts

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed' | null;

export interface Ticket {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  department?: {
    id?: number;
    name: string;
  };
  assignee?: {
    name: string;
  };
  user?: { // คนที่สร้าง Ticket (ผู้แจ้ง)
    id: number;
    name: string;
    email?: string;
  };
  ticket_types?: { // ประเภทของ Ticket
    id?: number;
    name: string;
  };
   priority: 'low' | 'medium' | 'high'; // เพิ่ม priority
  contact: string; // เพิ่ม contact
  comment?: string; // เพิ่ม comment
  files?: Array<{ id: number; filename: string; filepath: string; }>; // เพิ่ม files
  // files?: Array<{ id: number; filename: string; filepath: string; }>; // ถ้าต้องการค้นหาข้อมูลไฟล์ด้วย
}

/**
 * แปลงค่าสถานะ Ticket เป็นชื่อภาษาไทย
 * @param status สถานะ Ticket (ภาษาอังกฤษ)
 * @returns ชื่อสถานะภาษาไทย
 */
export function statusName(status: TicketStatus | string | undefined): string {
  if (!status) return '';
  switch (status) {
    case "open":
      return "ใหม่";
    case "in_progress":
      return "กำลังดำเนินการ";
    case "pending":
      return "รอดำเนินการ";
    case "closed":
      return "เสร็จสิ้น";
    default:
      return status;
  }
}

export function getStatusStyle(status: TicketStatus | string | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-700';
  switch (status) {
    case "open":
      return "bg-red-100 text-red-700";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700";
    case "pending":
      return "bg-gray-100 text-gray-700";
    case "closed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * แปลงค่าความสำคัญ Ticket เป็นชื่อภาษาไทย
 * @param priority ความสำคัญ Ticket (ภาษาอังกฤษ)
 * @returns ชื่อความสำคัญภาษาไทย
 */
export const priorityName = (priority: string) => {
  if (!priority) return '';
  switch (priority) {
    case "low":
      return "ต่ำ";
    case "medium":
      return "กลาง";
    case "high":
      return "สูง";
    default:
      return priority;
  }
};

export const departmentName = (department: string) => {
  if (!department) return '';
  switch (department) {
    case "it":
      return "ฝ่ายไอที";
    case "sale":
      return "ฝ่ายขาย";
    case "hr":
      return "ฝ่ายทรัพยากรบุคคล";
    case "production":
      return "ฝ่ายผลิต";
    case "accounting":
      return "ฝ่ายบัญชี";
    case "strategy":
      return "ฝ่ายกลยุทธ์";
    case "marketing":
      return "ฝ่ายการตลาด";
    case "overseas_purchasing":
      return "ฝ่ายจัดซื้อต่างประเทศ";
    case "transportation":
      return "ฝ่ายขนส่ง";
    default:
      return department;
  }
};

/**
 * ฟอร์แมตวันที่เป็นรูปแบบ DD/MM/YYYY
 * @param dateString วันที่ในรูปแบบ string หรือ Date object
 * @returns วันที่ในรูปแบบ DD/MM/YYYY หรือ "-" ถ้าวันที่ไม่ถูกต้อง
 */
export function formatDateDDMMYYYY(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-"; // Invalid date check
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0 ต้อง +1
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "-";
  }
}

/**
 * ค้นหา Tickets จาก searchTerm ที่กำหนด
 * @param tickets อาร์เรย์ของ Ticket ที่ต้องการค้นหา
 * @param searchTerm คำค้นหา (string)
 * @returns อาร์เรย์ของ Ticket ที่ตรงกับคำค้นหา
 */
export function searchTickets(tickets: Ticket[], searchTerm: string): Ticket[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return tickets;
  }

  const lowerSearchTerm = searchTerm.toLowerCase().trim();

  return tickets.filter(ticket => {
    const valuesToSearch = [
      ticket.reference_number,
      ticket.title,
      ticket.description,
      departmentName(ticket.department?.name),
      ticket.status, // ค้นหาจาก key สถานะ (เช่น 'open')
      statusName(ticket.status), // ค้นหาจากชื่อสถานะภาษาไทย (เช่น 'เปิด')
      priorityName(ticket.priority),
      ticket.user?.name, // ชื่อผู้แจ้ง
      ticket.assignee?.name, // ชื่อผู้รับผิดชอบ
      ticket.ticket_types?.name, // ชื่อประเภท Ticket
      ticket.created_at, // ค้นหาจากวันที่สร้าง (ISO format)
      formatDateDDMMYYYY(ticket.created_at), // ค้นหาจากวันที่สร้าง (DD/MM/YYYY)
    ];

    return valuesToSearch.some(value =>
      value && typeof value === 'string' && value.toLowerCase().includes(lowerSearchTerm)
    );
  });
}