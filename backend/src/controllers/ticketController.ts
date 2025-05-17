// controllers/ticketController.ts
import { PrismaClient, TicketStatus, TicketPriority, TicketFile, AssigneeFile  } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ApiResponse } from '../types/index';

const prisma = new PrismaClient()

// สมมุติว่าไฟล์อยู่ใน public/uploads/
const UPLOAD_FOLDER = path.join(__dirname, '../../uploads/user');

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
    }, newFiles?: Express.Multer.File[] // ไฟล์ใหม่ที่อัปโหลด
): Promise<ApiResponse> => {
    try {
        const updatedTicket = await prisma.$transaction(async (tx) => {
            const updatedTicket = await tx.ticket.update({
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
                    department: { select: { name: true } },
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    files: { select: { id: true, ticket_id: true, filename: true } },
                }
            });
            return updatedTicket
        });

        if (!updatedTicket) {
            // ไม่ควรเกิดขึ้นถ้า ID ถูกต้อง แต่เป็นการป้องกัน
            throw new Error(`Ticket with ID ${id} not found for update.`);
        }
        //ถ้ามีไฟล์ใหม่ถูกอัปโหลด ให้บันทึกข้อมูลไฟล์เหล่านั้น
        if (newFiles && newFiles.length > 0) {
            const fileCreationPromises = newFiles.map(file => {
                return prisma.ticketFile.create({ // หรือ tx.file.create ตามชื่อ model ของคุณ
                    data: {
                        filename: file.filename,  // ชื่อไฟล์ที่ multer สร้าง
                        filepath: file.path,      // path เต็มที่ multer บันทึกไฟล์
                        ticket_id: id,      // เชื่อมโยงกับ Ticket ID ปัจจุบัน
                    },
                });
            });
            await Promise.all(fileCreationPromises);
        }

        return {
            success: true,
            message: 'Ticket updated successfullyy',
            data: updatedTicket,
        }
    } catch (error) {
        console.error('Error updating ticket:', error);
        return {
            success: false,
            message: 'Failed to update ticket',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export const addAssigneeFilesToTicket = async (
    ticketId: number,
    files: Express.Multer.File[],
    uploaderUserId: number // ID ของ assignee ที่ทำการอัปโหลด
): Promise<ApiResponse<{ files: AssigneeFile[] }>> => {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { assignee_id: true } // ดึง assignee_id เพื่อตรวจสอบสิทธิ์
        });

        if (!ticket) {
            return {
                success: false,
                message: `Ticket with ID ${ticketId} not found. Cannot attach assignee files.`,
            };
        }

        // Authorization: ตรวจสอบว่าผู้ใช้ที่อัปโหลดเป็น assignee ของ ticket นี้หรือไม่
        // หรืออาจจะอนุญาตให้ ADMIN/OFFICER ทำได้ด้วย (ขึ้นอยู่กับ business logic ของคุณ)
        // ในตัวอย่างนี้ เราจะตรวจสอบว่าเป็น assignee ที่กำหนดไว้ใน ticket หรือไม่
        // หากต้องการให้ Admin/Officer ทำได้ด้วย ให้เพิ่มเงื่อนไข req.user.role ใน route handler
        if (ticket.assignee_id !== uploaderUserId) {
            // ตรวจสอบเพิ่มเติมใน route handler สำหรับ role ADMIN/OFFICER ถ้าต้องการ
            // return {
            //     success: false,
            //     message: 'Forbidden. You are not the assignee of this ticket.',
            // };
        }

        if (!files || files.length === 0) {
            return {
                success: false,
                message: 'No files provided to attach.',
            };
        }

        const createdAssigneeFiles = await prisma.$transaction(async (tx) => {
            const fileCreationPromises = files.map(file => {
                return tx.assigneeFile.create({
                    data: {
                        filename: file.filename,
                        filepath: file.path,
                        ticket_id: ticketId,
                        uploadedBy_id: uploaderUserId, // ID ของ assignee
                    },
                });
            });
            return Promise.all(fileCreationPromises);
        });

        await prisma.ticket.update({ where: { id: ticketId }, data: { updated_at: new Date() } });

        return { success: true, message: 'Assignee files attached successfully.', data: { files: createdAssigneeFiles } };
    } catch (error) {
        console.error(`Error attaching assignee files to ticket ${ticketId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during assignee file attachment';
        return { success: false, message: 'Failed to attach assignee files.', error: errorMessage };
    }
};
