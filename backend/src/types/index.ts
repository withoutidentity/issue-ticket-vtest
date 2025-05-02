export type ApiResponse<T = any> = {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
  };
  
  export type TicketType = {
    id?: number;
    name: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
  };
  
  export type Ticket = {
    id?: number;
    title: string;
    description?: string;
    type_id?: number;
    user_id?: number;
    status?: string;
    created_at?: Date;
    updated_at?: Date;
    type?: TicketType;
  };