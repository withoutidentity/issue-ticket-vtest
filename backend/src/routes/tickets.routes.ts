import { Ticket } from './../types/index';
import { Router, Response } from 'express' // Removed Request as it's not directly used
import { PrismaClient, TicketStatus, LogActionType, User } from '@prisma/client' // Added LogActionType
import { authenticateToken, AuthenticatedRequest, authorizeRoles } from '../middleware/auth.middleware'
import { uploadUser, uploadAssignee } from '../middleware/upload'
import path from 'path'; // เพิ่ม import path
import { io, connectedUsers } from '../index'; // เพิ่ม import สำหรับ Socket.IO
import { sendTelegramMessage } from '../utils/sendTelegram'; // เพิ่ม import สำหรับ Telegram
import { format, startOfDay, endOfDay } from 'date-fns'; // นำเข้า date-fns
import fs from 'fs';
import { updateTicket, addAssigneeFilesToTicket } from '@/controllers/ticketController';

const router = Router()
const prisma = new PrismaClient()

// Helper function to create ticket log entries
async function createTicketLogEntry(
  ticket_id: number,
  user_id: number,
  user_name_snapshot: string, // Assuming req.user.name is available
  action_type: LogActionType,
  details: string,
  field_changed?: string | null,
  old_value?: string | null,
  new_value?: string | null
) {
  try {
    await prisma.ticketLog.create({
      data: {
        ticket_id,
        user_id,
        user_name_snapshot,
        action_type,
        details,
        field_changed: field_changed || null,
        old_value: old_value === undefined ? null : String(old_value), // Ensure undefined becomes null, and convert to string
        new_value: new_value === undefined ? null : String(new_value), // Ensure undefined becomes null, and convert to string
      },
    });
  } catch (logError) {
    console.error(`Failed to create ticket log for ticket ${ticket_id} (Action: ${action_type}):`, logError);
    // Depending on requirements, you might want to throw this error or handle it silently
  }
}

// Helper function to log a specific field change
async function logFieldChange(
  prisma: PrismaClient, // Pass prisma instance
  ticket_id: number,
  performingUser: { id: number; name: string, role: 'USER' | 'ADMIN' | 'OFFICER' | 'BANNED', }, // Simplified user type with required properties
  field: keyof Ticket | 'type_id' | 'department_id' | 'assignee_id' | 'priority' | 'contact' | 'comment', // Field name being changed
  oldValue: any,
  newValue: any,
  actionType: LogActionType,
  oldTicketFull: any // Full old ticket object for related data
) {
  if (String(oldValue) === String(newValue) || newValue === undefined) {
    return; // No change or new value not provided
  }

  let oldDisplayValue = String(oldValue ?? "ว่างเปล่า");
  let newDisplayValue = String(newValue ?? "ว่างเปล่า");
  const fieldDisplayNames: Record<string, string> = {
    title: "หัวข้อ",
    description: "รายละเอียด",
    type_id: "ประเภท Ticket",
    priority: "ระดับความสำคัญ",
    contact: "ข้อมูลติดต่อ",
    department_id: "แผนก",
    assignee_id: "ผู้รับผิดชอบ",
    comment: "ความคิดเห็น",
    status: "สถานะ",
  };
  const statusDisplayValues: Record<string, string> = {
    open: "รอดำเนินการ",
    in_progress: "กำลังดำเนินการ",
    assignee_id: "ผู้รับผิดชอบ",
    comment: "ความคิดเห็น",
    status: "สถานะ",
  };
  const displayFieldName = fieldDisplayNames[field as string] || field;

  if (field === 'type_id' && oldTicketFull.ticket_types) {
    oldDisplayValue = oldTicketFull.ticket_types.name ?? String(oldValue);
    const newType = await prisma.ticket_types.findUnique({ where: { id: newValue as number } });
    newDisplayValue = newType?.name ?? String(newValue);
  } else if (field === 'department_id' && oldTicketFull.department) {
    oldDisplayValue = oldTicketFull.department.name ?? String(oldValue);
    const newDept = await prisma.department.findUnique({ where: { id: newValue as number } });
    newDisplayValue = newDept?.name ?? String(newValue);
  } else if (field === 'assignee_id') {
    oldDisplayValue = oldTicketFull.assignee?.name ?? (oldValue === null ? "ไม่ได้มอบหมาย" : String(oldValue));
    if (newValue === null) newDisplayValue = "ยกเลิกการมอบหมาย";
    else {
      const newAssignee = await prisma.user.findUnique({ where: { id: newValue as number } });
      newDisplayValue = newAssignee?.name ?? String(newValue);
    }
  } else if (field === 'status') {
    oldDisplayValue = statusDisplayValues[oldValue as string] || String(oldValue);
    newDisplayValue = statusDisplayValues[newValue as string] || String(newValue);
  }


  await createTicketLogEntry(
    ticket_id,
    performingUser.id,
    performingUser.name,
    actionType,
    `เปลี่ยน ${displayFieldName} จาก '${oldDisplayValue}' เป็น '${newDisplayValue}'`,
    field as string,
    oldDisplayValue,
    newDisplayValue
  );
}

// POST /api/tickets/create
router.post(
  '/create',
  authenticateToken,
  uploadUser.array('files', 5), // เปลี่ยนไปใช้ uploadUser
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, type_id, contact, department_id } =
        req.body
      const performingUser = req.user;

      if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
        res.status(401).json({ error: 'User information is missing or invalid for logging.' });
        return
      }

      const files = req.files as Express.Multer.File[]

      // --- สร้างเลข Reference Number ---
      const now = new Date();
      // รูปแบบ YYMMDD (ปี พ.ศ. สองหลักท้าย)
      const Year = now.getFullYear();
      const datePart = format(now, 'ddMM') // วันเดือน
      const yearPart = Year.toString().substring(2); // ปี พ.ศ. สองหลักท้าย
      const fullDatePart = `${yearPart}${format(now, 'MMdd')}`; // ปีเดือนวัน เช่น 670523 สำหรับ 2024-05-23

      // กำหนดช่วงเวลาของวันนี้
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      // นับจำนวน Ticket ที่สร้างในวันนี้
      const ticketsCreatedToday = await prisma.ticket.count({
        where: {
          created_at: { // ตรวจสอบว่า model Ticket ของคุณมี field created_at
            gte: todayStart,
            lte: todayEnd,
          },
        }
      });
      const sequenceNumber = ticketsCreatedToday + 1;
      const paddedSequence = sequenceNumber.toString().padStart(2, '0'); // ลำดับ 2 หลักตามตัวอย่าง TK25052301
      const referenceNumberGenerated = `TK${fullDatePart}${paddedSequence}`; // รูปแบบ TKปีเดือนวันลำดับ
      // --- สิ้นสุดการสร้างเลข Reference Number ---

      const newTicket = await prisma.ticket.create({
        data: {
          title,
          description,
          ticket_types: {
            connect: { id: parseInt(type_id) } // เชื่อมกับ ticket_types ที่มี id = 1
          },
          reference_number: referenceNumberGenerated, // เพิ่ม reference_number ที่สร้างขึ้น
          contact,
          department: {
            connect: { id: parseInt(department_id) }
          },
          user: {
            connect: { id: performingUser.id }
          },
          files: {
            create: files.map((file) => ({
              filename: file.filename,
              filepath: file.path,
            })),
          },
        },
        include: {
          ticket_types: true,
          files: true,
          department: true
        },
      })

      // Create a log entry for ticket creation
      await createTicketLogEntry(
        newTicket.id,
        performingUser.id,
        performingUser.name,
        LogActionType.TICKET_CREATED,
        `Ticket '${newTicket.reference_number}' ถูกสร้างขึ้น`, // เปลี่ยนเป็น reference_number
        null, // field_changed
        null, // old_value
        `Reference: ${newTicket.reference_number}` // new_value (summary with reference_number)
      );

      // เริ่ม: แจ้งเตือน OFFICER ที่ออนไลน์เมื่อมี Ticket ใหม่ (status: open)
      if (newTicket.status === TicketStatus.open) {
        const notificationMessageToOfficer = `ปัญหาใหม่ รหัส ${newTicket.reference_number} (${newTicket.title}) เข้ามาในระบบ`;
        const eventTypeForOfficer = 'open_ticket_alert';

        // ดึง ID ของ Officer ทั้งหมดที่ is_officer_confirmed เป็น true
        const activeOfficers = await prisma.user.findMany({
          where: {
            role: 'OFFICER',
            is_officer_confirmed: true, // พิจารณาว่าต้องการแจ้งเตือนเฉพาะ Officer ที่ confirmed หรือไม่
          },
          select: { id: true },
        });

        for (const officer of activeOfficers) {
          // สร้าง Notification ใน DB สำหรับ Officer แต่ละคน (ถ้ายังไม่มี)
          // (ส่วนนี้คล้ายกับใน notification.routes.ts /check-open แต่ทำทันที)
          let dbNotificationForOfficer = await prisma.notifications.findFirst({
            where: { user_id: officer.id, ticket_id: newTicket.id, type: eventTypeForOfficer },
          });

          let wasNotificationNewlyCreated = false; // ตัวแปรใหม่เพื่อติดตามว่า notification ถูกสร้างใหม่หรือไม่

          if (!dbNotificationForOfficer) {
            const createdDbNotification = await prisma.notifications.create({
              data: {
                user_id: officer.id,
                ticket_id: newTicket.id,
                message: notificationMessageToOfficer,
                type: eventTypeForOfficer,
                is_read: false,
              },
            });
            dbNotificationForOfficer = createdDbNotification; // ใช้อันที่เพิ่งสร้าง
            wasNotificationNewlyCreated = true; // ตั้งค่าเป็น true เมื่อสร้างใหม่
          }

          const officerSocketId = connectedUsers.get(officer.id);
          if (officerSocketId && dbNotificationForOfficer) { // ตรวจสอบว่ามี dbNotificationForOfficer ด้วย
            console.log(`[Ticket Create] Emitting 'notification:new' (open_alert) to OFFICER ${officer.id} (socket ${officerSocketId}) for new ticket ${newTicket.id}`);
            io.to(officerSocketId).emit('notification:new', {
              userId: officer.id, // ID ของ Officer ผู้รับ
              message: notificationMessageToOfficer,
              ticketId: newTicket.id,
              ticketCode: newTicket.reference_number,
              type: eventTypeForOfficer,
              timestamp: new Date().toISOString(),
              // เพิ่มข้อมูลจาก DB Notification ที่เกี่ยวข้อง
              db_notification_id: dbNotificationForOfficer.id,
              db_is_read: dbNotificationForOfficer.is_read,
              db_created_at: dbNotificationForOfficer.created_at?.toISOString(),
            });
          }
        } // End of for loop

        // เริ่ม: Logic ใหม่สำหรับการส่ง Telegram ไปยังกลุ่มแผนก IT ตามเงื่อนไข
        if (newTicket.status === TicketStatus.open && newTicket.department_id) {
          const itDepartment = await prisma.department.findUnique({
            where: { name: 'it' }, // หรือใช้ ID ที่แน่นอนหากชื่อ 'it' อาจมีการเปลี่ยนแปลง
            select: { group_id: true, thread_id: true }
          });

          if (itDepartment && itDepartment.group_id && itDepartment.thread_id && itDepartment.thread_id.length > 0) {
            // ดึงข้อมูลแผนกต้นทางของ Ticket ใหม่
            const sourceDepartment = await prisma.department.findUnique({
              where: { id: newTicket.department_id },
              // สมมติว่ามีการเพิ่ม field 'it_target_thread_index' ใน model Department
              // field นี้จะเก็บ index ของ array thread_id ของแผนก IT ที่จะใช้
              select: { name: true, it_target_thread_index: true }
            });

            let targetThreadIdForIT: string | undefined = undefined;

            if (sourceDepartment && sourceDepartment.it_target_thread_index !== null && sourceDepartment.it_target_thread_index !== undefined) {
              const targetIndex = sourceDepartment.it_target_thread_index;
              if (targetIndex >= 0 && targetIndex < itDepartment.thread_id.length) {
                targetThreadIdForIT = itDepartment.thread_id[targetIndex];
                console.log(`[Ticket Create] New ticket from '${sourceDepartment.name}' dept. Notifying IT dept in thread: ${targetThreadIdForIT} (index ${targetIndex})`);
              } else {
                console.warn(`[Ticket Create] Configured IT target thread index ${targetIndex} for department '${sourceDepartment.name}' is out of bounds for IT department's threads (count: ${itDepartment.thread_id.length}).`);
              }
            } else if (sourceDepartment) {
              console.log(`[Ticket Create] Department '${sourceDepartment.name}' does not have IT notification target thread index configured.`);
            } else {
              console.warn(`[Ticket Create] Could not find source department with ID ${newTicket.department_id} for IT notification routing.`);
            }

            if (targetThreadIdForIT) { // ส่งเมื่อมี targetThreadId ที่ตรงเงื่อนไขเท่านั้น
              await sendTelegramMessage(itDepartment.group_id, notificationMessageToOfficer, targetThreadIdForIT);
            }
          }
        }
        // สิ้นสุด: Logic ใหม่สำหรับการส่ง Telegram
      }
      // สิ้นสุด: แจ้งเตือน OFFICER

      // START: Notify all ADMINs about the new ticket
      if (newTicket.status === TicketStatus.open) { // Ensure we notify for open tickets, adjust if needed for other initial statuses
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        const adminNotificationMessage = `Ticket ใหม่ ${newTicket.reference_number} (${newTicket.title}) จากแผนก ${newTicket.department?.name || 'ไม่ระบุ'} ถูกสร้าง`;
        const adminNotificationType = 'ADMIN_TICKET_CREATED';

        for (const admin of admins) {
          let dbNotificationForAdmin = await prisma.notifications.findFirst({
            where: { user_id: admin.id, ticket_id: newTicket.id, type: adminNotificationType },
          });

          if (!dbNotificationForAdmin) {
            dbNotificationForAdmin = await prisma.notifications.create({
              data: {
                user_id: admin.id,
                ticket_id: newTicket.id,
                message: adminNotificationMessage,
                type: adminNotificationType,
                is_read: false,
              },
            });
          }

          const adminSocketId = connectedUsers.get(admin.id);
          if (adminSocketId && dbNotificationForAdmin) {
            io.to(adminSocketId).emit('notification:new', {
              userId: admin.id, message: adminNotificationMessage, ticketId: newTicket.id,
              ticketCode: newTicket.reference_number, type: adminNotificationType, timestamp: new Date().toISOString(),
              db_notification_id: dbNotificationForAdmin.id, db_is_read: dbNotificationForAdmin.is_read, db_created_at: dbNotificationForAdmin.created_at?.toISOString(),
            });
            console.log(`[Ticket Create] Emitting '${adminNotificationType}' to ADMIN ${admin.id} for new ticket ${newTicket.id}`);
          }
        }
      }
      // END: Notify all ADMINs
      res.status(201).json(newTicket)
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('reference_number')) {
        res.status(409).json({ // 409 Conflict
          success: false,
          message: 'Failed to create ticket due to a reference number conflict. Please try again.',
          error: 'Reference number conflict'
        });
        return
      }
      console.error('Error creating ticket:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  }
)

// GET /api/tickets
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { visibility } = req.query; // visibility can be 'active', 'hidden', 'all'

    let whereClause: any = {};

    // Base filtering for non-admin/officer users
    if (user?.role !== 'ADMIN' && user?.role !== 'OFFICER') {
      whereClause.user_id = user?.id;
      whereClause.is_hidden = false; // Non-admins/officers ONLY see active tickets they own
    } else {
      // Admin/Officer specific visibility
      if (visibility === 'hidden') {
        whereClause.is_hidden = true;
      } else if (visibility === 'all') {
        // No is_hidden filter, show all (both hidden and not hidden)
      } else { // Default or 'active'
        whereClause.is_hidden = false;
      }
    }

    const tickets = await prisma.ticket.findMany({ // Modify query to exclude hidden tickets by default
      where: whereClause,
      select: { // เปลี่ยนมาใช้ select เพื่อความชัดเจนในการดึงข้อมูล
        id: true,
        title: true,
        reference_number: true, // เพิ่ม reference_number
        description: true, // เพิ่มตามความจำเป็น
        status: true,
        priority: true,
        contact: true,
        created_at: true,
        updated_at: true,
        user_id: true,
        user: { select: { id: true, name: true, email: true } },
        ticket_types: { select: { id: true, name: true } },
        files: { select: { id: true, filename: true } }, // เลือกเฉพาะฟิลด์ที่ต้องการจาก files
        department: { select: { id: true, name: true } },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        // เพิ่มฟิลด์อื่นๆ ของ Ticket ที่ต้องการดึงโดยตรง
      },
      orderBy: { created_at: 'asc' },
    })

    res.json(tickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch tickets' })
  }
})

//GET /api/tickets/:id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = parseInt(req.params.id, 10)

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket_types: { select: { name: true } },
        files: { select: { id: true, ticket_id: true, filename: true } },
        assigneeFiles: { select: { id: true, ticket_id: true, filename: true } },
        department: { select: { id: true, name: true } },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
    }

    res.json(ticket)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch ticket' })
  }
})

// PUT /api/tickets/update/:id
router.put(
  '/update/:id',
  authenticateToken, // 1. เพิ่ม authenticateToken middleware
  uploadUser.array('new_ticket_files', 5), // เปลี่ยนไปใช้ uploadUser (ถ้าไฟล์เหล่านี้มาจาก user หรือเป็นการอัปเดตทั่วไป)
  async (req: AuthenticatedRequest, res: Response): Promise<void> => { // 3. แก้ไข Request type และเพิ่ม Promise<void>
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
      return; // 4. เพิ่ม return หลังส่ง response
    }

    const performingUser = req.user; // Cast to User type for better type safety if your auth middleware provides it
    // console.log('[DEBUG] Performing User:', JSON.stringify(performingUser, null, 2)); // Log performing user

    if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
      // console.error('[DEBUG] User information is missing or invalid for logging.');
      res.status(401).json({ error: 'User information is missing or invalid for logging.' });
      return
    }

    // 5. Parse IDs และจัดการค่าที่อาจเป็น null/undefined
    const { title, description, priority, contact, comment, status, deletedFileIds } = req.body; // Added deletedFileIds
    const files = req.files as Express.Multer.File[] | undefined; // ไฟล์ใหม่ที่อัปโหลด

    let type_id_parsed: number | undefined = undefined;
    if (req.body.type_id) {
      type_id_parsed = parseInt(req.body.type_id, 10);
      if (isNaN(type_id_parsed)) {
        res.status(400).json({ success: false, message: 'Invalid type ID format' });
        return;
      }
    }

    let department_id_parsed: number | undefined = undefined;
    if (req.body.department_id) {
      department_id_parsed = parseInt(req.body.department_id, 10);
      if (isNaN(department_id_parsed)) {
        res.status(400).json({ success: false, message: 'Invalid department ID format' });
        return;
      }
    }

    let assignee_id_parsed: number | null | undefined = undefined; // undefined: ไม่เปลี่ยนแปลง, null: ตั้งค่าเป็น null
    if (req.body.assignee_id === null || req.body.assignee_id === "") {
      assignee_id_parsed = null;
    } else if (req.body.assignee_id) {
      const parsed = parseInt(req.body.assignee_id, 10);
      if (isNaN(parsed)) {
        res.status(400).json({ success: false, message: 'Invalid assignee ID format' });
        return;
      }
      assignee_id_parsed = parsed;
    }

    let parsedDeletedFileIds: number[] | undefined = undefined;
    if (deletedFileIds && Array.isArray(deletedFileIds)) {
      parsedDeletedFileIds = deletedFileIds.map(id => parseInt(String(id), 10)).filter(id => !isNaN(id));
    } else if (typeof deletedFileIds === 'string' && deletedFileIds.length > 0) {
      // Handle comma-separated string or single ID string if needed
      parsedDeletedFileIds = deletedFileIds.split(',').map(id => id.trim()).filter(idStr => idStr.length > 0).map(idStr => parseInt(idStr, 10)).filter(id => !isNaN(id));
    } else if (deletedFileIds && typeof deletedFileIds === 'number' && !isNaN(deletedFileIds)) { // Handle single number
      parsedDeletedFileIds = [deletedFileIds];
    }

    try {
      // Fetch the current ticket state BEFORE updating for comparison
      const oldTicket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          ticket_types: { select: { name: true } },
          department: { select: { name: true } },
          assignee: { select: { name: true } },
        }
      });

      // console.log('[DEBUG] Old Ticket Data:', JSON.stringify(oldTicket, null, 2));

      if (!oldTicket) {
        // console.error('[DEBUG] Old ticket not found for logging.');
        res.status(404).json({ success: false, message: 'Ticket not found for logging.' });
        return
      }

      const result = await updateTicket(id, { // This is a call to your controller
        title,
        description,
        type_id: type_id_parsed,
        priority,
        contact,
        department_id: department_id_parsed,
        assignee_id: assignee_id_parsed,
        comment,
        status,
      }, files, parsedDeletedFileIds); // ส่ง files และ parsedDeletedFileIds ไปให้ updateTicket controller

      // console.log('[DEBUG] Result from updateTicket controller:', JSON.stringify(result, null, 2));

      // Check if the update was successful and if result.data (which is the ticket object itself) exists
      if (result.success && result.data && typeof result.data.id === 'number') {
        // console.log('[DEBUG] Update successful, proceeding to log changes.');
        const updatedTicketData = result.data; // Use result.data directly as the ticket object

        // Log changes for each field
        if (title !== undefined) {
          // console.log(`[DEBUG] Checking title: OLD='${oldTicket.title}', NEW='${title}'`);
          await logFieldChange(prisma, id, performingUser, 'title', oldTicket.title, title, LogActionType.TITLE_UPDATED, oldTicket);
        }

        if (description !== undefined) {
          // console.log(`[DEBUG] Checking description: OLD='${oldTicket.description}', NEW='${description}'`); 
          await logFieldChange(prisma, id, performingUser, 'description', oldTicket.description, description, LogActionType.DESCRIPTION_UPDATED, oldTicket);
        }

        if (type_id_parsed !== undefined) {
          // console.log(`[DEBUG] Checking type_id: OLD='${oldTicket.type_id}', NEW='${type_id_parsed}'`); 
          await logFieldChange(prisma, id, performingUser, 'type_id', oldTicket.type_id, type_id_parsed, LogActionType.TYPE_UPDATED, oldTicket);
        }

        if (priority !== undefined && oldTicket.priority !== priority) {
          // console.log(`[DEBUG] Checking priority: OLD='${oldTicket.priority}', NEW='${priority}'`); 
          await logFieldChange(prisma, id, performingUser, 'priority', oldTicket.priority, priority, LogActionType.PRIORITY_UPDATED, oldTicket);
        }

        if (contact !== undefined) {
          // console.log(`[DEBUG] Checking contact: OLD='${oldTicket.contact}', NEW='${contact}'`); 
          await logFieldChange(prisma, id, performingUser, 'contact', oldTicket.contact, contact, LogActionType.CONTACT_UPDATED, oldTicket);
        }

        if (department_id_parsed !== undefined) {
          // console.log(`[DEBUG] Checking department_id: OLD='${oldTicket.department_id}', NEW='${department_id_parsed}'`); 
          await logFieldChange(prisma, id, performingUser, 'department_id', oldTicket.department_id, department_id_parsed, LogActionType.DEPARTMENT_UPDATED, oldTicket);
        }

        if (assignee_id_parsed !== undefined) {
          // console.log(`[DEBUG] Checking assignee_id: OLD='${oldTicket.assignee_id}', NEW='${assignee_id_parsed}'`); 
          await logFieldChange(prisma, id, performingUser, 'assignee_id', oldTicket.assignee_id, assignee_id_parsed, LogActionType.ASSIGNEE_CHANGED, oldTicket);
        }

        if (comment !== undefined && oldTicket.comment !== comment) {
          // console.log(`[DEBUG] Checking comment: OLD='${oldTicket.comment}', NEW='${comment}'`); 
          await logFieldChange(prisma, id, performingUser, 'comment', oldTicket.comment, comment, LogActionType.COMMENT_UPDATED, oldTicket);
        }

        if (status !== undefined) {
          // console.log(`[DEBUG] Checking status: OLD='${oldTicket.status}', NEW='${status}'`); 
          await logFieldChange(prisma, id, performingUser, 'status', oldTicket.status, status, LogActionType.STATUS_CHANGED, oldTicket);
        }

        // --- Logging for Requester File Changes ---
        // This assumes your `updateTicket` controller returns information about file changes
        // in `result.data.addedRequesterFiles` (array of filenames)
        // and `result.data.deletedRequesterFileNames` (array of filenames)

        if (updatedTicketData.addedRequesterFiles && Array.isArray(updatedTicketData.addedRequesterFiles)) {
          for (const filename of updatedTicketData.addedRequesterFiles) {
            await createTicketLogEntry(
              id, performingUser.id, performingUser.name,
              LogActionType.REQUESTER_FILE_ADDED,
              `เพิ่มไฟล์ '${filename}' (ผู้แจ้ง)`,
              'requester_files', null, filename
            );
          }
        }
        if (updatedTicketData.deletedRequesterFileNames && Array.isArray(updatedTicketData.deletedRequesterFileNames)) {
          for (const filename of updatedTicketData.deletedRequesterFileNames) {
            await createTicketLogEntry(
              id, performingUser.id, performingUser.name,
              LogActionType.REQUESTER_FILE_REMOVED,
              `ลบไฟล์ '${filename}' (ผู้แจ้ง)`,
              'requester_files', filename, null
            );
          }
        }
      }
      // เริ่ม: ส่วนการแจ้งเตือนและ Log การเปลี่ยนสถานะ (ย้ายมาจาก updateStatus)
      // ตรวจสอบว่ามีการเปลี่ยนแปลงสถานะหรือไม่ และสถานะใหม่เป็นค่าที่ต้องการแจ้งเตือน
      if (status !== undefined && oldTicket.status !== status) {
        const ticketDetailsForNotification = await prisma.ticket.findUnique({
          where: { id: id }, // Use the parsed id
          select: { user_id: true, reference_number: true, title: true }
        });

        if (ticketDetailsForNotification && ticketDetailsForNotification.user_id) {
          const ownerUserId = ticketDetailsForNotification.user_id;
          let eventType: 'in_progress_alert' | 'done_alert' | null = null;
          let dynamicMessage = "";
          const statusDisplayMap: Record<string, string> = {
            open: "รอดำเนินการ",
            in_progress: "กำลังดำเนินการ",
            pending: "รอการแก้ไข",
            closed: "เสร็จสิ้น",
            // Add other statuses if any
          };

          if (status === TicketStatus.in_progress) {
            eventType = 'in_progress_alert';
            dynamicMessage = `Ticket ${ticketDetailsForNotification.reference_number} กำลังดำเนินการ`;
          } else if (status === TicketStatus.closed) {
            eventType = 'done_alert';
            dynamicMessage = `Ticket ${ticketDetailsForNotification.reference_number} ดำเนินการเสร็จสิ้นแล้ว`;
          }

          if (eventType) {
            let dbNotification = await prisma.notifications.findFirst({
              where: {
                user_id: ownerUserId,
                ticket_id: id,
                type: eventType,
              },
            });

            let shouldSendWebSocket = false;
            let shouldSendTelegram = false;

            if (!dbNotification) {
              const newNotification = await prisma.notifications.create({
                data: {
                  user_id: ownerUserId,
                  ticket_id: id,
                  message: dynamicMessage,
                  type: eventType,
                  is_read: false,
                },
              });
              dbNotification = newNotification;
              shouldSendWebSocket = true;
              shouldSendTelegram = true;
            } else if (!dbNotification.is_read) {
              shouldSendWebSocket = true;
            }

            if (shouldSendWebSocket && dbNotification) {
              const socketId = connectedUsers.get(ownerUserId);
              if (socketId) {
                io.to(socketId).emit('notification:new', {
                  userId: ownerUserId, message: dynamicMessage, ticketId: id,
                  ticketCode: ticketDetailsForNotification.reference_number, type: eventType,
                  timestamp: new Date().toISOString(), db_notification_id: dbNotification.id,
                  db_is_read: dbNotification.is_read, db_created_at: dbNotification.created_at?.toISOString(),
                });
              }
            }
            if (shouldSendTelegram) {
              // เริ่ม: Logic ใหม่สำหรับการส่ง Telegram เมื่อสถานะ Ticket เปลี่ยน
              const ticketDepartmentId = oldTicket.department_id; // department_id ของ Ticket ที่กำลังอัปเดต

              // แจ้งเตือนไปยังกลุ่มของแผนกเจ้าของ Ticket
              if (ticketDepartmentId) {
                const ticketOwnerDepartment = await prisma.department.findUnique({
                  where: { id: ticketDepartmentId },
                  select: { name: true, group_id: true, thread_id: true }
                });

                if (ticketOwnerDepartment?.group_id && ticketOwnerDepartment.thread_id) {
                  let targetThreadIdForOwnerDept: string | undefined = undefined;
                  if (status === TicketStatus.in_progress && ticketOwnerDepartment.thread_id.length >= 1) {
                    targetThreadIdForOwnerDept = ticketOwnerDepartment.thread_id[0];
                  } else if (status === TicketStatus.closed && ticketOwnerDepartment.thread_id.length >= 2) {
                    targetThreadIdForOwnerDept = ticketOwnerDepartment.thread_id[1];
                  }

                  if (targetThreadIdForOwnerDept) {
                    const messageToOwnerDept = `Ticket รหัส ${ticketDetailsForNotification.reference_number} ของแผนก ${ticketOwnerDepartment.name} ข้อความ: ${dynamicMessage}`;
                    await sendTelegramMessage(ticketOwnerDepartment.group_id, messageToOwnerDept, targetThreadIdForOwnerDept);
                  }
                }
              }

              // แจ้งเตือนไปยังแผนก IT (เพิ่มเติม)
              const itDepartment = await prisma.department.findUnique({
                where: { name: 'it' },
                select: { group_id: true, thread_id: true }
              });

              // ตรวจสอบว่ามีแผนก IT, group_id, thread_id และ ticketDepartmentId (ID ของแผนกที่ Ticket สังกัด) ก่อนดำเนินการ
              if (itDepartment?.group_id && itDepartment.thread_id?.length > 0 && ticketDepartmentId) {
                // ดึงข้อมูลแผนกต้นทางของ Ticket (แผนกที่ Ticket สังกัด) เพื่อใช้ it_target_thread_index
                const sourceDepartmentForITRouting = await prisma.department.findUnique({
                  where: { id: ticketDepartmentId },
                  select: { name: true, it_target_thread_index: true }
                });

                let targetThreadIdForIT: string | undefined = undefined;
                let originalTicketDeptName = "ไม่ทราบแผนก";

                if (sourceDepartmentForITRouting && sourceDepartmentForITRouting.it_target_thread_index !== null && sourceDepartmentForITRouting.it_target_thread_index !== undefined) {
                  originalTicketDeptName = sourceDepartmentForITRouting.name;
                  const targetIndex = sourceDepartmentForITRouting.it_target_thread_index;
                  if (targetIndex >= 0 && targetIndex < itDepartment.thread_id.length) {
                    targetThreadIdForIT = itDepartment.thread_id[targetIndex];
                  } else {
                    console.warn(`[Ticket Update] Configured IT target thread index ${targetIndex} for department '${sourceDepartmentForITRouting.name}' is out of bounds for IT department's threads (count: ${itDepartment.thread_id.length}).`);
                  }
                } else if (sourceDepartmentForITRouting) { // แผนกต้นทางมีอยู่ แต่ไม่ได้กำหนด it_target_thread_index
                  originalTicketDeptName = sourceDepartmentForITRouting.name; // ยังคงใช้ชื่อแผนกสำหรับข้อความได้
                } else { // ไม่พบแผนกต้นทางด้วย ID ที่ระบุ
                  console.warn(`[Ticket Update] Could not find source department with ID ${ticketDepartmentId} for IT notification routing for status ${status}.`);
                }

                if (targetThreadIdForIT) {
                  const messageToIT = `Ticket รหัส ${ticketDetailsForNotification.reference_number} (แผนก: ${originalTicketDeptName}) ข้อความ: ${dynamicMessage}`;
                  await sendTelegramMessage(itDepartment.group_id, messageToIT, targetThreadIdForIT);
                }
              } else if (itDepartment?.group_id && !ticketDepartmentId) { // กรณีมีแผนก IT แต่ Ticket ไม่มี department_id
                console.warn(`[Ticket Update] Cannot route IT notification for ticket ${id} because its department ID is missing.`);
              }
              // สิ้นสุด: Logic ใหม่สำหรับการส่ง Telegram
            }

            // START: Notify all ADMINs about the status change
            const adminsForStatusUpdate = await prisma.user.findMany({
              where: { role: 'ADMIN' },
              select: { id: true },
            });

            const ticketDepartmentName = oldTicket.department?.name || 'ไม่ระบุแผนก';
            const statusChangeMessageForAdmin = `Ticket ${ticketDetailsForNotification.reference_number} (แผนก: ${ticketDepartmentName}) สถานะเปลี่ยนเป็น ${statusDisplayMap[status as string] || status} โดย ${performingUser.name}`;
            const adminStatusChangeType = 'ADMIN_STATUS_CHANGED';

            for (const admin of adminsForStatusUpdate) {
              let dbNotificationForAdminStatus = await prisma.notifications.findFirst({
                // Consider if message should be part of uniqueness for re-notification logic
                where: { user_id: admin.id, ticket_id: id, type: adminStatusChangeType },
              });

              // Create new or update if message changed (e.g. different performing user for same status)
              // For simplicity, we'll create if not exists, or if exists but message is different.
              // Or, always create a new one if you want a log of each change for admins.
              // Current logic: create if not exists.
              if (!dbNotificationForAdminStatus) {
                dbNotificationForAdminStatus = await prisma.notifications.create({
                  data: {
                    user_id: admin.id, ticket_id: id, message: statusChangeMessageForAdmin,
                    type: adminStatusChangeType, is_read: false,
                  },
                });
              }

              const adminSocketId = connectedUsers.get(admin.id);
              if (adminSocketId && dbNotificationForAdminStatus) {
                io.to(adminSocketId).emit('notification:new', {
                  userId: admin.id, message: statusChangeMessageForAdmin, ticketId: id,
                  ticketCode: ticketDetailsForNotification.reference_number, type: adminStatusChangeType, timestamp: new Date().toISOString(),
                  db_notification_id: dbNotificationForAdminStatus.id, db_is_read: dbNotificationForAdminStatus.is_read, db_created_at: dbNotificationForAdminStatus.created_at?.toISOString(),
                });
              }
            }
            // END: Notify all ADMINs about status change
          }
        }
        // สิ้นสุด: ส่วนการแจ้งเตือนและ Log การเปลี่ยนสถานะ
      }

      res.status(result.success ? 200 : 500).json({ data: result });
      return;
    } catch (error) {
      console.error('Error updating ticket:', error); // Log error เพื่อ debug
      res.status(500).json({ // 7. กำหนด status code สำหรับ error
        success: false,
        message: 'Failed to update Ticket',
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
  });

// POST /api/tickets/:id/assignee-files - ให้ Assignee แนบไฟล์ (เก็บใน AssigneeFile)
router.post(
  '/:id/assignee-files',
  authenticateToken,
  uploadAssignee.array('assignee_attachments', 5), // เปลี่ยนไปใช้ uploadAssignee
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const ticketId = parseInt(req.params.id, 10);
    const files = req.files as Express.Multer.File[] | undefined;
    const performingUser = req.user;

    if (!performingUser || typeof performingUser.id !== 'number' || typeof performingUser.name !== 'string') {
      res.status(401).json({ error: 'User information is missing or invalid for logging.' });
      return;
    }

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID.' });
      return
    }

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded.' });
      return
    }

    if (!performingUser.id) {
      // ควรไม่เกิดขึ้นถ้า authenticateToken ทำงานถูกต้อง
      res.status(401).json({ success: false, message: 'User not authenticated for logging.' });
      return
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { assignee_id: true }
      });

      if (!ticket) {
        res.status(404).json({ success: false, message: `Ticket with ID ${ticketId} not found.` });
        return
      }

      // Authorization: ตรวจสอบว่าผู้ใช้ที่ล็อกอินเป็น assignee ของ ticket นี้ หรือเป็น ADMIN/OFFICER
      const isAssignee = ticket.assignee_id === performingUser.id;
      const userRole = performingUser.role; //สมมติว่า role อยู่ใน req.user
      const isAdminOrOfficer = userRole === 'ADMIN' || userRole === 'OFFICER';

      if (!(isAssignee || isAdminOrOfficer)) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to attach files to this ticket as an assignee.' });
        return
      }

      const result = await addAssigneeFilesToTicket(ticketId, files, performingUser.id);

      // Log each file addition
      if (result.success && files) {
        for (const file of files) {
          await createTicketLogEntry(
            ticketId,
            performingUser.id,
            performingUser.name,
            LogActionType.ASSIGNEE_FILE_ADDED,
            `เพิ่มไฟล์ '${file.filename}' (ผู้รับผิดชอบ)`,
            'assignee_files', // field_changed
            null, // old_value
            file.filename // new_value
          );
        }
      }

      if (result.success) {
        // ดึงข้อมูล Ticket ล่าสุดพร้อมไฟล์ทั้งหมด (ทั้ง TicketFile และ AssigneeFile)
        const updatedTicketWithAllFiles = await prisma.ticket.findUnique({
          where: { id: ticketId },
          include: { files: true, assigneeFiles: true } // files คือ TicketFile, assigneeFiles คือ AssigneeFile
        });
        res.status(201).json({ success: true, message: result.message, data: updatedTicketWithAllFiles });
      } else {
        const statusCode = result.message.includes('not found') ? 404 : (result.message.includes('No files') ? 400 : (result.message.includes('Forbidden') ? 403 : 500));
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error(`Route error attaching assignee files to ticket ${ticketId}:`, error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while attaching assignee files.',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

// DELETE /api/tickets/assignee-files/:fileId - Delete an assignee file
router.delete(
  '/assignee-files/:fileId',
  authenticateToken, // Ensure user is authenticated
  async (req: AuthenticatedRequest, res: Response) => {
    const fileId = parseInt(req.params.fileId, 10);
    const performingUser = req.user;

    if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
      res.status(401).json({ error: 'User information is missing or invalid for logging.' });
      return;
    }


    if (isNaN(fileId)) {
      res.status(400).json({ success: false, message: 'Invalid file ID.' });
      return
    }

    try {
      const assigneeFile = await prisma.assigneeFile.findUnique({
        where: { id: fileId },
        include: { ticket: { select: { assignee_id: true, user_id: true } } } // Include ticket to check permissions
      });

      if (!assigneeFile) {
        res.status(404).json({ success: false, message: 'Assignee file not found.' });
        return
      }

      // Authorization:
      // Allow if user is ADMIN, OFFICER, or the assignee of the ticket,
      // or the user who originally uploaded this specific assignee file.
      const isTicketAssignee = assigneeFile.ticket?.assignee_id === performingUser.id;
      const isUploader = assigneeFile.uploadedBy_id === performingUser.id;
      const isAdminOrOfficer = performingUser.role === 'ADMIN' || performingUser.role === 'OFFICER';

      if (!(isAdminOrOfficer || isTicketAssignee || isUploader)) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to delete this file.' });
        return
      }

      // Delete file from filesystem
      const filePath = assigneeFile.filepath; // Path stored in DB, e.g., 'uploads/assignee/filename.pdf'
      // Ensure the path is absolute or correctly relative to your project root for fs.unlinkSync
      // This example assumes filepath is relative from the project root.
      // Adjust if your `filepath` is stored differently.
      const absoluteFilePath = path.join(filePath); // Adjust path as needed

      if (fs.existsSync(absoluteFilePath)) {
        fs.unlinkSync(absoluteFilePath);
      } else {
        console.warn(`File not found on disk, but proceeding to delete DB record: ${absoluteFilePath}`);
      }

      // Delete record from database
      await prisma.assigneeFile.delete({
        where: { id: fileId },
      });

      // Create log entry for file deletion
      await createTicketLogEntry(
        assigneeFile.ticket_id,
        performingUser.id,
        performingUser.name,
        LogActionType.ASSIGNEE_FILE_REMOVED,
        `ลบไฟล์ '${assigneeFile.filename}' (ผู้รับผิดชอบ)`,
        'assignee_files', // field_changed
        assigneeFile.filename, // old_value
        null // new_value
      );

      // Optionally, update the ticket's updated_at timestamp
      await prisma.ticket.update({
        where: { id: assigneeFile.ticket_id },
        data: { updated_at: new Date() }
      });

      res.status(200).json({ success: true, message: 'Assignee file deleted successfully.' });

    } catch (error) {
      console.error(`Error deleting assignee file ${fileId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during file deletion';
      res.status(500).json({ success: false, message: 'Failed to delete assignee file.', error: errorMessage });
    }
  }
);


// PUT /api/tickets/assign/:id
router.put('/assign/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { userId: newAssigneeIdStr } = req.body; // userId from body is the new assignee's ID
  const performingUser = req.user;

  if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
    res.status(401).json({ error: 'User information is missing or invalid for logging.' });
    return;
  }

  const newAssigneeId = newAssigneeIdStr ? parseInt(newAssigneeIdStr, 10) : null;

  if (newAssigneeIdStr && isNaN(newAssigneeId as number)) {
    res.status(400).json({ error: "Invalid new assignee ID format." });
    return;
  }

  try {
    // เฉพาะ Admin หรือเจ้าของ token ที่เป็น userId นั้นเอง ถึงจะเปลี่ยนได้
    // Authorization: Allow ADMIN or OFFICER to assign.
    // Other roles might have different logic, e.g., self-assign if allowed.
    // For now, let's assume ADMIN/OFFICER can assign.
    if (performingUser.role !== "ADMIN" && performingUser.role !== "OFFICER") {
      res.status(403).json({ error: "Unauthorized to assign tickets." });
      return;
    }

    const oldTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignee: { select: { id: true, name: true } } }
    });

    if (!oldTicket) {
      res.status(404).json({ error: "Ticket not found for assignment." });
      return;
    }

    // Check if new assignee exists if an ID is provided
    let newAssignee: User | null = null;
    if (newAssigneeId !== null) {
      newAssignee = await prisma.user.findUnique({ where: { id: newAssigneeId } });
      if (!newAssignee) {
        res.status(404).json({ error: `Assignee user with ID ${newAssigneeId} not found.` });
        return;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignee_id: newAssigneeId, // This can be null to unassign
      },
      include: {
        assignee: true,
      },
    });

    res.json(updatedTicket);

    // Log the assignment change
    const oldAssigneeName = oldTicket.assignee?.name || "ไม่ได้มอบหมาย";
    const newAssigneeName = updatedTicket.assignee?.name || (newAssigneeId === null ? "ยกเลิกการมอบหมาย" : "ไม่ได้มอบหมาย");

    if (oldTicket.assignee_id !== updatedTicket.assignee_id) {
      await createTicketLogEntry(
        ticketId,
        performingUser.id,
        performingUser.name,
        LogActionType.ASSIGNEE_CHANGED,
        `เปลี่ยนผู้รับผิดชอบจาก '${oldAssigneeName}' เป็น '${newAssigneeName}'`,
        'assignee_id',
        oldAssigneeName, // Store name for readability
        newAssigneeName  // Store name for readability
      );
    }
  } catch (error) {
    res.status(500).json({ error: `Failed to assign ticket: ${error instanceof Error ? error.message : String(error)}` });
  }
});

// DELETE /api/tickets/requester-files/:ticketId/:filename - Delete a requester file associated with a ticket
router.delete(
  '/requester-files/:ticketId/:filename',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const ticketId = parseInt(req.params.ticketId, 10);
    const { filename } = req.params;
    const performingUser = req.user;

    if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
      res.status(401).json({ error: 'User information is missing or invalid for logging.' });
      return
    }

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID.' });
      return
    }

    // Basic filename validation (similar to file.routes.ts)
    if (!filename || typeof filename !== 'string' || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({ error: 'Invalid filename format.' });
      return
    }

    try {
      const fileRecord = await prisma.ticketFile.findFirst({
        where: {
          ticket_id: ticketId,
          filename: filename,
        },
        include: {
          ticket: { select: { user_id: true, assignee_id: true } }
        }
      });

      if (!fileRecord) {
        res.status(404).json({ success: false, message: 'File not found for this ticket.' });
        return
      }

      // Authorization check (Example: only ticket owner, or admin/officer can delete)
      // You might want to refine this based on your exact requirements
      const canDelete = performingUser.role === 'ADMIN' ||
        performingUser.role === 'OFFICER' ||
        fileRecord.ticket?.user_id === performingUser.id;
      // Add assignee check if needed: || fileRecord.ticket?.assignee_id === performingUser.id;

      if (!canDelete) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to delete this file.' });
        return
      }

      // Delete file from filesystem (filepath is stored in fileRecord)
      if (fs.existsSync(fileRecord.filepath)) {
        fs.unlinkSync(fileRecord.filepath);
      } else {
        console.warn(`File not found on disk (requester file): ${fileRecord.filepath}, but proceeding to delete DB record.`);
      }

      // Delete record from database
      await prisma.ticketFile.delete({
        where: { id: fileRecord.id },
      });

      // Create log entry
      await createTicketLogEntry(
        ticketId,
        performingUser.id,
        performingUser.name,
        LogActionType.REQUESTER_FILE_REMOVED,
        `ลบไฟล์ '${filename}' (ผู้แจ้ง) ออกจาก Ticket ID ${ticketId}`,
        'requester_files', // field_changed
        filename,          // old_value
        null               // new_value
      );

      res.status(200).json({ success: true, message: 'Requester file deleted successfully and logged.' });

    } catch (error) {
      console.error(`Error deleting requester file ${filename} for ticket ${ticketId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during file deletion';
      res.status(500).json({ success: false, message: 'Failed to delete requester file.', error: errorMessage });
    }
  }
);

// PATCH /api/tickets/visibility - Update the is_hidden status for multiple tickets
router.patch(
  '/visibility',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const { ticketIds, isHidden } = req.body; // Expecting an array of ticket IDs and a boolean value
    const performingUser = req.user;

    if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
      res.status(401).json({ error: 'User information is missing or invalid for logging.' });
      return;
    }

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      res.status(400).json({ success: false, message: 'An array of ticket IDs is required.' });
      return;
    }

    if (typeof isHidden !== 'boolean') {
      res.status(400).json({ success: false, message: 'A boolean value for isHidden is required.' });
      return;
    }

    const parsedTicketIds = ticketIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (parsedTicketIds.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid ticket IDs provided.' });
      return;
    }

    try {
      // Fetch the tickets before updating to get their current state for logging
      const ticketsToUpdate = await prisma.ticket.findMany({
        where: { id: { in: parsedTicketIds } },
        select: { id: true, is_hidden: true, reference_number: true }
      });

      if (ticketsToUpdate.length === 0) {
        res.status(404).json({ success: false, message: 'No tickets found with the provided IDs.' });
        return;
      }

      const updatedTickets = await prisma.ticket.updateMany({
        where: { id: { in: parsedTicketIds } },
        data: { is_hidden: isHidden },
      });

      // Log the change for each ticket that was actually updated (where the status changed)
      for (const ticket of ticketsToUpdate) {
        if (ticket.is_hidden !== isHidden) {
          const actionDetail = isHidden ? 'ซ่อน' : 'แสดง';
          await createTicketLogEntry(
            ticket.id,
            performingUser.id,
            performingUser.name,
            LogActionType.TICKET_VISIBILITY_CHANGED, // Use the new log type
            `${actionDetail} Ticket รหัส '${ticket.reference_number}'`,
            'is_hidden', // field_changed
            String(ticket.is_hidden), // old_value
            String(isHidden) // new_value
          );
        }
      }

      res.status(200).json({ success: true, message: `Successfully updated visibility for ${updatedTickets.count} tickets.` });
    } catch (error) {
      console.error('Error updating ticket visibility:', error);
      res.status(500).json({ success: false, message: 'Failed to update ticket visibility.', error: error instanceof Error ? error.message : String(error) });
    }
  });

export default router