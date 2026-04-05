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


export interface FileInfo {
    id: number
    filename: string
    path: string
}
