export interface Ticket {
    id: number;
    title: string;
    description: string;
    type_id: number | ''; // สามารถเป็น number (เมื่อเลือก) หรือ empty string (ค่าเริ่มต้น)
    priority: 'low' | 'medium' | 'high' | '';
    contact: string;
    department_id: number | '';
    status: 'open' | 'in_progress' | 'pending' | 'closed' | ''; // สถานะที่เป็นไปได้ หรือ empty string
    assignee: {
        assignee_id: number
        name: string
    }
    comment: string
    files: FileInfo[]
}

export interface FileInfo {
    id: number
    filename: string
    path: string
}
