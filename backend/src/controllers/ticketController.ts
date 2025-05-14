import { TicketFile } from './../../node_modules/.prisma/client/index.d';
// controllers/ticketController.ts
import { PrismaClient, TicketStatus, TicketPriority } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ApiResponse } from '../types/index';
import { strict } from 'assert';

const prisma = new PrismaClient()

// สมมุติว่าไฟล์อยู่ใน public/uploads/
const UPLOAD_FOLDER = path.join(__dirname, '../../public/uploads');

export const updateTicket = async (
    id: number,
    data: {
        title?: string;
        description?: string;
        type_id?: number | null;
        priority?: TicketPriority;
        contact?: string;
        department_id?: number | null;
        assignee_id?: number | null;
        comment?: string;
        status?: TicketStatus;
        deletedFileIds?: any;
    }
): Promise<ApiResponse> => {
    try {
        // 1. ลบไฟล์เก่า (ถ้ามี)
        // if (deletedFileIds && deletedFileIds.length > 0) {
        //   const ids = JSON.parse(deletedFileIds);
        //   for (const id of ids) {
        //     const file = await prisma.ticketFile.findUnique({ where: { id: Number(id) } });
        //     if (file) {
        //       // ลบจาก DB
        //       await prisma.ticketFile.delete({ where: { id: Number(id) } });
        //       // ลบจากโฟลเดอร์
        //       const filePath = path.join(UPLOAD_FOLDER, file.filename);
        //       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        //     }
        //   }
        // }

        // 2. อัปเดต ticket หลัก
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                type_id: data.type_id,
                priority: data.priority,
                contact: data.contact,
                department_id: data.department_id,
                assignee_id: data.assignee_id,
                comment: data.comment,
                status: data.status,
                updated_at: new Date()
            },
            include: {
                ticket_types: { select: { name: true } },
                department: { select: {name: true}},
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                files: { select: { id: true, ticket_id: true, filename: true}},
            }
        });

        // 3. แนบไฟล์ใหม่ (ถ้ามี)
        // if (req.files && Array.isArray(req.files)) {
        //   for (const file of req.files) {
        //     await prisma.ticketFile.create({
        //       data: {
        //         filename: file.filename,
        //         filepath: file.path,
        //         ticket_id: ticketId,
        //       },
        //     });
        //   }
        // }

        return {
            success: true,
            message: 'Ticket updated successfullyy',
            data: updatedTicket,
        };
    } catch (error) {
        console.error('Error updating ticket:', error);
        return {
            success: false,
            message: 'Failed to update ticket',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
