export interface Ticket {
  id: number
  title: string
  description: string
  type_id: number | ""
  priority: "" | "low" | "medium" | "high"
  contact: string
  department_id: number | ""
  status: "" | "open" | "in_progress" | "pending" | "closed"
  assignee: {
    id: number
    name: string
  }
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
