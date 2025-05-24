import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types/index';
import { format, startOfDay, endOfDay } from 'date-fns'; // นำเข้า date-fns

const prisma = new PrismaClient();

export const getAllTickets = async (): Promise<ApiResponse<any>> => {
  try {
    const tickets = await prisma.ticket.findMany({
        select: {
            id: true,
            reference_number: true, // เพิ่มฟิลด์เลขอ้างอิง
            user_id: true,
            title: true,
            description: true,
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
  reference_number?: string;
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

    // --- สร้างเลข Reference Number ---
    const now = new Date();
    // รูปแบบ YYMMDD
    const datePart = format(now, 'yyMMdd');

    // กำหนดช่วงเวลาของวันนี้
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // นับจำนวน Ticket ที่สร้างในวันนี้
    const ticketsCreatedToday = await prisma.ticket.count({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd,
        },
      }
    });

    // คำนวณลำดับและเติมเลขศูนย์ข้างหน้า (ใช้ 3 หลัก)
    const sequenceNumber = ticketsCreatedToday + 1;
    const paddedSequence = sequenceNumber.toString().padStart(3, '0');

    const referenceNumber = `TK${datePart}${paddedSequence}`;
    // --- สิ้นสุดการสร้างเลข Reference Number ---

    const newTicket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description || null,
        type_id: data.type_id || null,
        user_id: data.user_id || null,
        status: 'open',
        reference_number: referenceNumber, // เพิ่มเลขอ้างอิงที่สร้างขึ้น
      },
        select: {
            id: true,
            title: true,
            reference_number: true, // เพิ่มเลขอ้างอิงในข้อมูลที่ส่งกลับ
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    // จัดการกรณีที่อาจเกิดการชนกันของเลขอ้างอิง (Race Condition)
    if (error.code === 'P2002' && error.meta?.target?.includes('reference_number')) {
         return {
            success: false,
            message: 'Failed to create ticket due to a potential conflict in reference number generation. Please try again.',
         };
    }
  }
};

export const getTicketById = async (id: number): Promise<ApiResponse> => {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          // include จะดึงฟิลด์ทั้งหมดของ Ticket มาอยู่แล้ว รวมถึง reference_number
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
          description: data.description, // อนุญาตให้อัปเดต description เป็น null ได้ถ้าส่งมาเป็น null
          type_id: data.type_id, // อนุญาตให้อัปเดต type_id เป็น null ได้ถ้าส่งมาเป็น null
          // ไม่ควรอัปเดต reference_number หลังจากสร้างครั้งแรก
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