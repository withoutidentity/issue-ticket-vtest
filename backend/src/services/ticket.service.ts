import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types/index';

const prisma = new PrismaClient();

export const getAllTickets = async (): Promise<ApiResponse<any>> => {
  try {
    const tickets = await prisma.ticket.findMany({
        select: {
            id: true,
            title: true,
            description: true
        },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      success: true,
      message: 'Tickets retrieved successfully',
      data: tickets
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to retrieve tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const createTicket = async (data: {
  title: string;
  description?: string;
  type_id?: number;
  user_id?: number;
}): Promise<ApiResponse<any>> => {
  try {
    // ตรวจสอบว่า type_id มีอยู่จริง (ถ้ามี)
    if (data.type_id) {
      const typeExists = await prisma.ticket_types.count({
        where: { id: data.type_id }
      });

      if (typeExists === 0) {
        return {
          success: false,
          message: 'Invalid ticket type ID'
        };
      }
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description || null,
        type_id: data.type_id || null,
        user_id: data.user_id || null,
        status: 'open'
      },
        select: {
            id: true,
            title: true,
            description: true,
            type_id: true,
            user_id: true,
            status: true,
            created_at: true,
            updated_at: true
        }
    });

    return {
      success: true,
      message: 'Ticket created successfully',
      data: newTicket
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getTicketById = async (id: number): Promise<ApiResponse> => {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          ticket_types: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
  
      if (!ticket) {
        return {
          success: false,
          message: 'Ticket not found',
          error: 'Ticket not found'
        };
      }
  
      return {
        success: true,
        message: 'Ticket retrieved successfully',
        data: ticket
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
  
  export const updateTicket = async (
    id: number,
    data: {
      title?: string;
      description?: string;
      type_id?: number | null;
      status?: any;
    }
  ): Promise<ApiResponse> => {
    try {
      // ตรวจสอบว่ามี Ticket นี้จริงหรือไม่
      const existingTicket = await prisma.ticket.findUnique({
        where: { id }
      });
  
      if (!existingTicket) {
        return {
          success: false,
          message: 'Ticket not found',
          error: 'Ticket not found'
        };
      }
  
      // ตรวจสอบว่า type_id ที่จะอัปเดตมีอยู่จริง (ถ้ามีการส่งมา)
      if (data.type_id !== undefined && data.type_id !== null) {
        const typeExists = await prisma.ticket_types.count({
          where: { id: data.type_id }
        });
  
        if (typeExists === 0) {
          return {
            success: false,
            message: 'Invalid ticket type ID',
            error: 'Invalid ticket type ID'
          };
        }
      }
  
      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          type_id: data.type_id,
          status: data.status,
          updated_at: new Date()
        },
        include: {
          ticket_types: true,
          user: true
        }
      });
  
      return {
        success: true,
        message: 'Ticket updated successfully',
        data: updatedTicket
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
  
  export const deleteTicket = async (id: number): Promise<ApiResponse> => {
    try {
      // ตรวจสอบว่ามี Ticket นี้จริงหรือไม่
      const existingTicket = await prisma.ticket.findUnique({
        where: { id }
      });
  
      if (!existingTicket) {
        return {
          success: false,
          message: 'Ticket not found',
          error: 'Ticket not found'
        };
      }
  
      const deletedTicket = await prisma.ticket.delete({
        where: { id }
      });
  
      return {
        success: true,
        message: 'Ticket deleted successfully',
        data: deletedTicket
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

// เพิ่มฟังก์ชันอื่นๆ (getTicketById, updateTicket, deleteTicket) ตามรูปแบบเดียวกัน