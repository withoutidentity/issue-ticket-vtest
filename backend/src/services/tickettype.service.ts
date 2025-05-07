import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types';

const prisma = new PrismaClient();

export const getAllTicketTypes = async (): Promise<ApiResponse<any>> => {
  try {
    const types = await prisma.ticket_types.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      success: true,
      message: 'Ticket types retrieved successfully',
      data: types
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to retrieve ticket types',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const createTicketType = async (data: {
  name: string;
  description?: string;
}): Promise<ApiResponse<any>> => {
  try {
    const newType = await prisma.ticket_types.create({
      data: {
        name: data.name,
        description: data.description || null
      }
    });

    return {
      success: true,
      message: 'Ticket type created successfully',
      data: newType
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create ticket type',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const deleteTicketType = async (id: number): Promise<ApiResponse<any>> => {
  try {
    // ตรวจสอบว่ามี Ticket ใช้ Type นี้อยู่หรือไม่
    const ticketsCount = await prisma.ticket.count({
      where: { type_id: id }
    });

    if (ticketsCount > 0) {
      return {
        success: false,
        message: 'Cannot delete ticket type because it is in use by some tickets'
      };
    }

    const deletedType = await prisma.ticket_types.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'Ticket type deleted successfully',
      data: deletedType
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete ticket type',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};