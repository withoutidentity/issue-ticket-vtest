import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken,  AuthenticatedRequest } from '../middleware/auth.middleware' // สมมติว่าคุณมี middleware นี้

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/logs/tickets/:ticketId
 * @desc    Get all logs for a specific ticket
 * @access  Private (Requires authentication)
 */
router.get('/tickets/:ticketId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { ticketId } = req.params;
    const id = parseInt(ticketId, 10);

    if (isNaN(id)) {
        res.status(400).json({ message: 'Ticket ID ไม่ถูกต้อง' });
        return 
    }

    try {
        // 1. ตรวจสอบว่า Ticket นี้มีอยู่จริงหรือไม่
        const ticket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!ticket) {
            res.status(404).json({ message: 'ไม่พบ Ticket ที่ระบุ' });
            return 
        }

        // 2. ดึงข้อมูล Logs ทั้งหมดที่เกี่ยวข้องกับ Ticket ID นี้
        // โดยเรียงจากใหม่สุดไปเก่าสุด
        const logs = await prisma.ticketLog.findMany({
            where: { ticket_id: id },
            orderBy: {
                timestamp: 'desc',
            },
            // Optionally, if you wanted to include current user details (if user still exists)
            // include: {
            //   user: {
            //     select: { name: true }
            //   }
            // }
            // However, user_name_snapshot is generally preferred for historical accuracy.
        });

        // 3. จัดรูปแบบข้อมูล Log เพื่อให้ตรงกับที่ Frontend คาดหวัง (โดยเฉพาะ field user_name)
        const formattedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp, // Prisma DateTime จะถูก serialize เป็น ISO string
            user_name: log.user_name_snapshot || 'System/Unknown User', // ใช้ snapshot หรือ fallback
            action_type: log.action_type, // Enum value จะเป็น string
            details: log.details,
            field_changed: log.field_changed,
            old_value: log.old_value,
            new_value: log.new_value,
            // ticket_id: log.ticket_id, // อาจจะไม่จำเป็นต้องส่งกลับ เพราะ client รู้อยู่แล้ว
            // user_id: log.user_id, // อาจจะไม่จำเป็น ถ้า user_name เพียงพอ
        }));

        res.status(200).json(formattedLogs);

    } catch (error) {
        console.error('Error fetching ticket logs:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ Ticket', error: error.message });
        } else {
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ Ticket' });
        }
    }
});

export default router;