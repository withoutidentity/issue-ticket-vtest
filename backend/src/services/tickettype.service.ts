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

export const updateTicketType = async (
  id: number,
  data: { name?: string; description?: string | null }
): Promise<ApiResponse<any>> => {
  try {
    // Validate name if provided for update
    if (data.name !== undefined && data.name.trim() === '') {
      return {
        success: false,
        message: 'Ticket type name cannot be empty when provided for update.',
      };
    }

    const prismaUpdateData: { name?: string; description?: string | null } = {};
    if (data.name !== undefined) {
      prismaUpdateData.name = data.name;
    }
    if (data.description !== undefined) {
      prismaUpdateData.description = data.description; // Allows setting to null or empty string
    }

    if (Object.keys(prismaUpdateData).length === 0) {
      return { success: false, message: 'No data provided for update.' };
    }

    const updatedType = await prisma.ticket_types.update({
      where: { id },
      data: prismaUpdateData,
    });

    return { success: true, message: 'Ticket type updated successfully', data: updatedType };
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error: Record to update not found
      return { success: false, message: `Ticket type with ID ${id} not found.` };
    }
    return { success: false, message: 'Failed to update ticket type', error: error instanceof Error ? error.message : 'Unknown error' };
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