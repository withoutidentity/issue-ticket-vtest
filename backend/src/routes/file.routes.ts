import { Router, Response } from 'express';
import { PrismaClient} from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';
import fs from 'fs/promises'; // ใช้ fs.promises เพื่อ async/await ที่ง่ายขึ้น
import path from 'path'; // สำหรับการตรวจสอบ path หากจำเป็น

const router = Router();
const prisma = new PrismaClient();

// API Endpoint: DELETE /api/uploads/user/:filename
router.delete('/:filename', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename } = req.params;

    // 1. ตรวจสอบความถูกต้องของชื่อไฟล์ (ป้องกัน Path Traversal และปัญหาอื่นๆ)
    //    ชื่อไฟล์ที่ได้จาก multer (timePart-originalname) ไม่ควรมี / หรือ \
    if (!filename || typeof filename !== 'string' || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        res.status(400).json({ error: 'Invalid filename format.' });
        return;
    }

    try {
        // 2. ค้นหาข้อมูลไฟล์ในฐานข้อมูล
        const fileRecord = await prisma.ticketFile.findFirst({
            where: { filename: filename },
            // หากต้องการตรวจสอบสิทธิ์การลบที่ซับซ้อนขึ้น (เช่น เจ้าของ ticket เท่านั้น)
            include: { ticket: { select: { user_id: true } } }
        });

        if (!fileRecord) {
            res.status(404).json({ error: 'File not found in database.' });
            return;
        }

        // 3. (สำคัญ) ตรวจสอบสิทธิ์การลบ (Authorization)
        //    ตัวอย่าง: อนุญาตให้เฉพาะ Admin หรือเจ้าของ Ticket ที่ไฟล์นั้นผูกอยู่ด้วยทำการลบได้
        //    ในที่นี้ เราจะสมมติว่าถ้า user authenticate ผ่าน และรู้ชื่อไฟล์ (ซึ่งควรจะ unique) ก็สามารถลบได้
        //    แต่ในระบบจริง ควรมีการตรวจสอบสิทธิ์ที่เข้มงวดกว่านี้
        if (!req.user) { // authenticateToken ควรจะจัดการเรื่องนี้แล้ว แต่เป็นการป้องกันอีกชั้น
             res.status(401).json({ error: 'User not authenticated.' });
             return;
        }
        // --- ตัวอย่างการตรวจสอบสิทธิ์ที่เข้มงวดขึ้น (ต้อง uncomment และปรับแก้ตามต้องการ) ---
        // const ticket = await prisma.ticket.findUnique({ where: { id: fileRecord.ticket_id }});
        // if (!ticket) {
        //     // กรณีไฟล์ไม่ผูกกับ ticket หรือ ticket ถูกลบไปแล้ว (ควรจัดการตาม business logic)
        //     console.warn(`File ${filename} is not associated with a valid ticket.`);
        // } else if (ticket.user_id !== req.user.id && req.user.role !== 'ADMIN') {
        //    return res.status(403).json({ error: 'Forbidden. You do not have permission to delete this file.' });
        // }
        // --- สิ้นสุดตัวอย่างการตรวจสอบสิทธิ์ ---

        const filePathToDelete = fileRecord.filepath; // `filepath` ที่เก็บตอนอัปโหลดคือ full path

        if (!filePathToDelete) {
            console.error(`File record for ${filename} (ID: ${fileRecord.id}) is missing filepath.`);
            // อาจตัดสินใจลบ record ออกจาก DB แม้จะไม่มี path เพราะอาจเป็นข้อมูลที่ผิดพลาด
            await prisma.ticketFile.delete({ where: { id: fileRecord.id } });
            res.status(500).json({ error: 'File path information is missing in the database record. Record removed.' });
            return;
        }

        // 4. ลบไฟล์ออกจากระบบไฟล์ (filesystem)
        try {
            await fs.access(filePathToDelete); // ตรวจสอบว่าไฟล์มีอยู่จริงบน disk ก่อนลบ
            await fs.unlink(filePathToDelete);
        } catch (fsError: any) {
            if (fsError.code === 'ENOENT') {
                // ENOENT หมายถึง File Not Found - ไฟล์อาจถูกลบไปแล้ว
                console.warn(`File not found on filesystem, possibly already deleted: ${filePathToDelete}`);
                // ในกรณีนี้ เรายังควรดำเนินการลบ record ออกจาก DB ต่อไป (ถือว่าเป็น orphaned record)
            } else {
                // หากเกิด error อื่นๆ (เช่น ปัญหา permission) ควรหยุดและแจ้งข้อผิดพลาด
                console.error(`Filesystem error while deleting ${filePathToDelete}:`, fsError);
                res.status(500).json({ error: `Failed to delete file from filesystem: ${fsError.message}` });
                return;
            }
        }

        // 5. ลบข้อมูลไฟล์ออกจากฐานข้อมูล
        await prisma.ticketFile.delete({
            where: { id: fileRecord.id } // ลบด้วย ID ของ record เพื่อความแม่นยำ
        });

        res.status(200).json({ message: `File '${filename}' and its record deleted successfully.` });
        return;

    } catch (error: any) {
        console.error(`Error during deletion process for file ${filename}:`, error);
        if (error.code === 'P2025') { // Prisma error: "Record to delete does not exist."
            res.status(404).json({ error: 'File record not found in database (it may have been already deleted).' });
            return;
        }
        // Ensure this is the last response sent in the catch block
        res.status(500).json({ error: 'An unexpected error occurred while deleting the file.' });
        return;
    }
});

export default router;
