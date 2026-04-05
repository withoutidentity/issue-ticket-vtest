import express, { Request, Response } from 'express';
import { PrismaClient, TicketStatus } from '@prisma/client' // เพิ่ม TicketStatus หากยังไม่มี
import { io, connectedUsers } from '../index'; 
import { sendTelegramMessage } from '../utils/sendTelegram'; 
import { authenticateToken, AuthenticatedRequest, authorizeRoles } from '../middleware/auth.middleware'

// สมมติว่าคุณมี type สำหรับ req.user จาก authentication middleware
// interface AuthenticatedRequest extends Request {
//   user?: {
//     id: number;
//     // ... other user properties
//   };
// }
// ถ้าใช้ TypeScript และอยากให้ req.user มี type ที่ถูกต้อง อาจจะต้องประกาศ custom type
// หรือถ้า middleware ของคุณจัดการ type ให้อยู่แล้วก็ไม่ต้องทำ

const router = express.Router();
const prisma = new PrismaClient()

// ตรวจสอบ tickets ที่ in_progress และสร้าง notifications ใหม่หากยังไม่มี
// เปลี่ยนจาก GET /check-inprogress/:userId เป็น GET /check-inprogress
// userId จะมาจาก req.user.id ที่ได้จาก authentication middleware
router.get('/check-inprogress/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.userId); // ลบออก

  try {
    const inProgressTickets = await prisma.ticket.findMany({
      where: {
        user_id: userId,
        status: TicketStatus.in_progress,
      },
      select: {
        id: true,        // ID ของ ticket (PK)
        reference_number: true, // รหัส ticket ที่เป็น string เช่น TICKET-001
        title: true,
      },
    });

    for (const ticket of inProgressTickets) {
      const dynamicMessage = `เจ้าหน้าที่กำลังดำเนินการกับ tickets รหัส ${ticket.reference_number}`;

      let dbNotification = await prisma.notifications.findFirst({
        where: {
          user_id: userId,
          ticket_id: ticket.id, // ใช้ ID ของ ticket (PK)
          type: 'in_progress_alert',
        },
      });

      let shouldSendWebSocket = false;
      let shouldSendTelegram = false;

      if (!dbNotification) {
        // กรณีเป็นการแจ้งเตือนใหม่เอี่ยม
        const newDbNotification = await prisma.notifications.create({
          data: {
            user_id: userId,
            ticket_id: ticket.id,
            message: dynamicMessage, // เก็บข้อความที่สร้างขึ้นใหม่
            type: 'in_progress_alert',
            is_read: false, // ตั้งค่าเริ่มต้น is_read เป็น false
          },
        });
        dbNotification = newDbNotification; // อัปเดต dbNotification ให้เป็นตัวที่สร้างใหม่
        shouldSendWebSocket = true;
        shouldSendTelegram = true;
      } else if (!dbNotification.is_read) {
        // กรณีมีแจ้งเตือนอยู่แล้ว แต่ยังไม่อ่าน (is_read: false)
        shouldSendWebSocket = true; // ส่ง WebSocket เพื่อเตือนซ้ำ
        shouldSendTelegram = false; // ไม่ส่ง Telegram ซ้ำ
      }

      // หากต้องส่ง WebSocket
      if (shouldSendWebSocket && dbNotification) {
        // ส่งผ่าน WebSocket ถ้า user ออนไลน์
        const socketId = connectedUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('notification:new', {
            userId,
            message: dynamicMessage, // ใช้ข้อความที่สร้างล่าสุดสำหรับการแจ้งเตือนแบบ real-time
            ticketId: ticket.id,     // ID ของ ticket (PK)
            ticketCode: ticket.reference_number, // รหัส ticket (string)
            type: 'in_progress_alert',
            timestamp: new Date().toISOString(),
            // ส่งรายละเอียดเพิ่มเติมจาก DB notification
            db_notification_id: dbNotification.id,
            db_is_read: dbNotification.is_read,
            db_created_at: dbNotification.created_at?.toISOString(),
          });
        } 
      } 
    }

    // สำคัญ: ตอบ notify: true ทุกครั้งถ้ามี ticket in_progress (ไม่ว่ามี insert ใหม่หรือไม่)
    // ส่วนนี้ยังคงเหมือนเดิม เพื่อให้ client ทราบว่ามี ticket ที่กำลังดำเนินการอยู่
    if (inProgressTickets.length > 0) {
      res.status(200).json({
        notify: true,
        message: 'พบ ticket ที่กำลังดำเนินการ',
        notifications: inProgressTickets.map(ticket => ({
          ticket_id: ticket.reference_number, // ใช้ ticketCode ที่เป็น string
          title: ticket.title,
          message: `เจ้าหน้าที่กำลังดำเนินการกับ tickets รหัส ${ticket.reference_number}`
        }))
      });
    } else {
      res.json({ notify: false });
    }

  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ดึง notifications ทั้งหมดของผู้ใช้
// เปลี่ยนจาก GET /user/:userId เป็น GET /
// userId จะมาจาก req.user.id
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  // const userId = parseInt(req.params.userId); // ลบออก
  const userId = req.user?.id; // ใช้ userId จาก authenticated user

  try {
    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      include: {
        ticket: { // join กับ table tickets เพื่อเอา ticketCode
          select: { 
            reference_number: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // ปรับโครงสร้างข้อมูลให้มี ticket_code ตามที่ client คาดหวัง
    const responseNotifications = notifications.map(n => ({
      ...n,
      ticket_code: n.ticket?.reference_number || null, // เพิ่ม ticket_code
      // ticket: undefined, // ลบ object ticket ที่ include มา ถ้า client ไม่ต้องการ
    }));

    res.json(responseNotifications);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// mark notification ว่าอ่านแล้ว
// เปลี่ยน path เป็น /mark-read/:notificationId เพื่อความเป็นระเบียบ (optional)
router.post('/mark-read/:notificationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const notificationId = parseInt(req.params.notificationId);
  const userId = req.user?.id; // ใช้ userId จาก authenticated user

  if (isNaN(notificationId)) {
    res.status(400).json({ error: 'Invalid notification ID' });
    return 
  }

  try {
    // ตรวจสอบก่อนว่า notification นี้เป็นของผู้ใช้ที่ login อยู่จริงหรือไม่ (เพื่อความปลอดภัย)
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.user_id !== userId) {
      res.status(404).json({ error: 'Notification not found or access denied.' });
      return 
    }

    await prisma.notifications.update({
      where: {
        id: notificationId,
        // userId: userId, // เพิ่มเงื่อนไข userId ใน where เพื่อความปลอดภัยอีกชั้น (optional)
      },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err); // err is of type 'unknown'.
    // Prisma อาจ throw error ถ้า record ไม่เจอ (ขึ้นอยู่กับ version และ config)
    // P2025: Record to update not found.
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
        res.status(404).json({ error: 'Notification not found to mark as read.' });
        return
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ตรวจสอบ tickets ที่ done และสร้าง notifications ใหม่หากยังไม่มี
// เปลี่ยนจาก GET /check-done/:userId เป็น GET /check-done
// userId จะมาจาก req.user.id
router.get('/check-done/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  // const userId = parseInt(req.params.userId); // 🗑️ ลบออก
  const userId = parseInt(req.params.userId); // 

  try {
    const doneTickets = await prisma.ticket.findMany({
      where: {
        user_id: userId,
        status: TicketStatus.closed,
      },
      select: {
        id: true,         // ID ของ ticket (PK)
        title: true,
        reference_number: true, // รหัส ticket ที่เป็น string
      },
    });

    const createdNotificationsDetails = []; // เก็บรายละเอียดของ notification ที่สร้างใหม่สำหรับ response

    for (const ticket of doneTickets) {
      const existingNotification = await prisma.notifications.findFirst({
        where: {
          user_id: userId,
          ticket_id: ticket.id,
          type: 'done_alert',
        },
      });

      if (!existingNotification) {
        const message = `เจ้าหน้าที่ดำเนินการเสร็จสิ้นแล้วสำหรับ Ticket รหัส ${ticket.reference_number}`;

        await prisma.notifications.create({
          data: {
            user_id: userId,
            ticket_id: ticket.id,
            message: message,
            type: 'done_alert',
          },
        });

        // ส่งผ่าน WebSocket ถ้า user ออนไลน์
        const socketId = connectedUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('notification:new', {
            userId,
            message,
            ticketId: ticket.id,
            ticketCode: ticket.reference_number,
            type: 'done_alert',
            timestamp: new Date().toISOString(),
          });
        } else {
        }

        createdNotificationsDetails.push({
          ticket_id: ticket.reference_number,
          title: ticket.title,
          message,
        });
      }
    }

    // ตอบกลับตาม logic เดิม: notify: true ถ้ามีการสร้าง notification ใหม่เกิดขึ้น
    if (createdNotificationsDetails.length > 0) {
      res.status(200).json({
        notify: true,
        message: 'พบงานที่เสร็จสมบูรณ์และได้สร้างการแจ้งเตือนใหม่',
        notifications: createdNotificationsDetails,
      });
    } else {
      // ถ้าไม่มี ticket 'done' ที่ต้องสร้าง notification ใหม่
      // อาจจะยังต้องการเช็คว่ามี ticket 'done' อยู่หรือไม่ เพื่อส่ง notify: true หรือ false
      // Logic เดิมคือส่ง notify: false ถ้า newNotifications.length === 0
      // ซึ่งหมายความว่าถ้า ticket 'done' ทุกอันมี notification อยู่แล้ว ก็จะส่ง notify: false
      // หากต้องการให้ส่ง notify: true ถ้ามี doneTickets แม้จะไม่มีการสร้าง notification ใหม่
      // สามารถปรับเงื่อนไขตรงนี้ได้
      res.json({ notify: false, message: 'ไม่พบ Ticket ที่ดำเนินการเสร็จสิ้นที่ต้องแจ้งเตือนใหม่' });
    }

  } catch (err) {
    console.error('Error in /check-done:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/check-open - สำหรับ OFFICER ตรวจสอบ tickets ใหม่ (status: 'open')
// และสร้าง notification หากยังไม่เคยแจ้งเตือน officer คนนั้นสำหรับ ticket นั้น
router.get('/check-open', authenticateToken, authorizeRoles(['OFFICER']), async (req: AuthenticatedRequest, res: Response) => {
  const officerId = req.user!.id; // ID ของ OFFICER ที่ login อยู่
  let notifyResponse = false;
  let messageResponse = '';
  const responseNotificationsList = [];

  try {
    // 1. ดึง tickets ทั้งหมดที่มีสถานะ 'open'
    // ไม่ได้กรองตาม user_id ของ ticket เพราะ OFFICER ควรเห็น ticket 'open' ทั้งหมดในระบบ
    const openTickets = await prisma.ticket.findMany({
      where: {
        status: TicketStatus.open, // ใช้ enum TicketStatus.open เพื่อความปลอดภัยของ type
      },
      select: {
        id: true,                // ID ของ ticket (PK)
        reference_number: true,  // รหัส ticket ที่แสดงผล เช่น TK24010101
        title: true,
      },
    });

    if (openTickets.length > 0) {
      notifyResponse = true;
      messageResponse = 'มี Ticket ใหม่ที่ยังไม่ได้ดำเนินการ';
    } else {
      res.status(200).json({ notify: false, message: 'ไม่พบ Ticket ใหม่ที่ยังไม่ได้ดำเนินการ', notifications: [] });
      return;
    }

    for (const ticket of openTickets) {
      const notificationMessageText = `ปัญหาใหม่ รหัส ${ticket.reference_number} (${ticket.title}) เข้ามาในระบบ`;

      // 2. ตรวจสอบว่า OFFICER คนนี้เคยได้รับแจ้งเตือนสำหรับ ticket นี้ (ประเภท 'open_alert') หรือยัง
      const existingNotification = await prisma.notifications.findFirst({
        where: {
          user_id: officerId,
          ticket_id: ticket.id,
          type: 'open_alert',
        },
      });

      responseNotificationsList.push({
        ticket_id: ticket.reference_number, // ใช้ reference_number สำหรับการแสดงผล
        title: ticket.title,
        message: notificationMessageText, // ข้อความที่เกี่ยวข้องกับ ticket นี้
      });
    }

    res.status(200).json({
      notify: notifyResponse,
      message: messageResponse,
      notifications: responseNotificationsList,
    });

  } catch (err) {
    console.error('Error in /check-open:', err);
    res.status(500).json({ error: 'Internal server error while checking open tickets' });
  }
});

export default router;
