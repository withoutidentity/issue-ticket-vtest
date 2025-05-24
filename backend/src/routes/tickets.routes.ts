import { Ticket } from './../types/index';
import { Router, Request, Response } from 'express'
import { PrismaClient, TicketStatus, LogActionType, User } from '@prisma/client' // Added LogActionType
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware'
import { uploadUser, uploadAssignee } from '../middleware/upload'
import path from 'path'; // เพิ่ม import path
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
  performingUser: { id: number; name: string, role: 'USER' | 'ADMIN' | 'OFFICER' | 'BANNED',  }, // Simplified user type with required properties
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
      const { title, description, type_id, priority, contact, department_id } =
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
          priority,
          contact,
          department: {
            connect: { id: parseInt(department_id) }
          },
          user: {
            connect: { id: performingUser.id }
          },
          files: {
            create: files.map((file) => ({
              filename: file.filename ,
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
    const user = req.user
    const tickets = await prisma.ticket.findMany({
      where: user?.role === 'ADMIN' || user?.role === 'OFFICER' ? {} : { user_id: user?.id },
      select: { // เปลี่ยนมาใช้ select เพื่อความชัดเจนในการดึงข้อมูล
        id: true,
        title: true,
        reference_number: true, // เพิ่ม reference_number
        description: true, // เพิ่มตามความจำเป็น
        status: true,
        priority: true,
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
        files: { select: { id: true, ticket_id: true, filename: true}},
        assigneeFiles: { select: { id: true, ticket_id: true, filename: true}},
        department: { select: { id:true, name: true}},
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
      } else {
        console.warn('[DEBUG] Update was not successful OR ticket data missing in result, skipping log creation.');
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


// PUT /api/tickets/updateStatus/:id
router.put('/updateStatus/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = parseInt(req.params.id, 10)
  const { status } = req.body

  const performingUser = req.user;

  if (!performingUser || typeof performingUser.id !== 'number' || !performingUser.name) {
    res.status(401).json({ error: 'User information is missing or invalid for logging.' });
    return;
  }

  if (!['open', 'in_progress', 'pending', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Invalid status specified' })
    return;
  }
  
  try {
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true }
    });

    if (!oldTicket) {
      res.status(404).json({ error: 'Ticket not found for status update.' });
      return;
    }

    const updatedTicketStatus = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status as TicketStatus },
    });

    if (oldTicket.status !== updatedTicketStatus.status) {
      await createTicketLogEntry(
        ticketId,
        performingUser.id,
        performingUser.name,
        LogActionType.STATUS_CHANGED,
        `เปลี่ยนสถานะจาก '${oldTicket.status}' เป็น '${updatedTicketStatus.status}'`,
        'status',
        oldTicket.status,
        updatedTicketStatus.status
      );
    }

    res.status(200).json({
      message: 'Status updated successfully',
      data: updatedTicketStatus,
    });
    return;
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      message: 'Failed to update status',
      error,
    });
  }
})

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
        newAssignee = await prisma.user.findUnique({ where: { id: newAssigneeId }});
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
            ticket: { select: { user_id: true, assignee_id: true }}
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

// GET /api/tickets/:id
// router.get("/tickets/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
//   const id = parseInt(req.params.id);

//   try {
//     const ticket = await prisma.ticket.findUnique({
//       where: { id },
//       include: {
//         assignee: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     })

//     if (!ticket) res.status(404).json({ error: "Ticket not found" })

//     res.json(ticket)
//   } catch (error) {
//     res.status(500).json({ error: "Failed to get ticket" })
//   }
// })


export default router


// import { Router } from 'express';
// import { Request, Response } from 'express';
// import {
//   getAllTickets,
//   createTicket,
//   getTicketById,
//   updateTicket,
//   deleteTicket
// } from '../services/ticket.service';

// const router = Router();

// // GET /api/tickets - ดึง Ticket ทั้งหมด
// router.get('/', async (req: Request, res: Response) => {
//   try {
//     const result = await getAllTickets();
//     res.status(result.success ? 200 : 500).json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// // POST /api/tickets/create - สร้าง Ticket ใหม่
// router.post('/create', async (req: Request, res: Response) => {
//   try {
//     if (!req.body.title) {
//       res.status(400).json({
//         success: false,
//         message: 'Ticket title is required'
//       });
//     }

//     const result = await createTicket({
//       title: req.body.title,
//       description: req.body.description,
//       type_id: req.body.type_id,
//       user_id: req.body.user_id
//     });
    
//     res.status(result.success ? 201 : 500).json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// // GET /api/tickets/:id - ดึง Ticket โดย ID
// router.get('/:id', async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (isNaN(id)) {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid ticket ID'
//       });
//     }

//     const result = await getTicketById(id);
//     res.status(result.success ? 200 : 404).json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// // PUT /api/tickets/:id - อัปเดต Ticket
// router.put('/:id', async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (isNaN(id)) {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid ticket ID'
//       });
//     }

//     const result = await updateTicket(id, {
//       title: req.body.title,
//       description: req.body.description,
//       type_id: req.body.type_id,
//       status: req.body.status
//     });
    
//     res.status(result.success ? 200 : 500).json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// // DELETE /api/tickets/:id - ลบ Ticket
// router.delete('/:id', async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (isNaN(id)) {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid ticket ID'
//       });
//     }

//     const result = await deleteTicket(id);
//     res.status(result.success ? 200 : 500).json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }

  
// });

// export default router;