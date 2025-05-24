export interface Ticket {
  id: number
  reference_number: string;
  title: string
  description: string
  ticket_types?: {
    id: number;
    name: string;
  };
  priority: "" | "low" | "medium" | "high"
  contact: string
  department?: { // Ensure department includes id
    id?: number;
    name: string; 
  }
  status: "" | "open" | "in_progress" | "pending" | "closed"
  assignee: {
    id: number
    name: string
  }
  user?: {
    id: number;
    name: string;
    email: string;
  };
  comment: string
  files: {
    id: number
    name: string
    path: string
  }[]
  created_at: string
}

export interface FileInfo {
    id: number
    filename: string
    path: string
}
