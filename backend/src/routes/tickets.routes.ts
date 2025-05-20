import { Ticket } from './../types/index';
import { Router, Request, Response } from 'express'
import { PrismaClient, TicketStatus } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware'
import { uploadUser, uploadAssignee } from '../middleware/upload'
import path from 'path'; // เพิ่ม import path
import fs from 'fs';
import { updateTicket, addAssigneeFilesToTicket } from '@/controllers/ticketController'; 

const router = Router()
const prisma = new PrismaClient()

// POST /api/tickets/create
router.post(
  '/create',
  authenticateToken,
  uploadUser.array('files', 5), // เปลี่ยนไปใช้ uploadUser
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, type_id, priority, contact, department_id } =
        req.body

      const files = req.files as Express.Multer.File[]

      const newTicket = await prisma.ticket.create({
        data: {
          title,
          description,
          ticket_types: {
            connect: { id: parseInt(type_id) } // เชื่อมกับ ticket_types ที่มี id = 1
          },
          priority,
          contact,
          department: {
            connect: { id: parseInt(department_id) }
          },
          user: {
            connect: { id: req.user!.id }
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

      res.status(201).json(newTicket)
    } catch (error) {
      console.error('Error creating ticket:', error)
      res.status(500).json({ error: 'Failed to create ticket' })
    }
  }
)

// GET /api/tickets
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user
    const tickets = await prisma.ticket.findMany({
      where: user?.role === 'ADMIN' || user?.role === 'OFFICER' ? {} : { user_id: user?.id },
      include: {
        user: { select: { name: true, email: true } },
        ticket_types: { select: { name: true } },
        files: true,
        department: { select: { id:true, name: true}},
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
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
        user: { select: { name: true, email: true } },
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

    // 5. Parse IDs และจัดการค่าที่อาจเป็น null/undefined
    const { title, description, priority, contact, comment, status } = req.body;
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

    try {
      const result = await updateTicket(id, {
        title,
        description,
        type_id: type_id_parsed,
        priority,
        contact,
        department_id: department_id_parsed,
        assignee_id: assignee_id_parsed,
        comment,
        status,
      }, files); // ส่ง files ไปให้ updateTicket controller

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
    const uploaderUserId = req.user?.id; // ID ของผู้ใช้ที่ล็อกอิน (assignee)

    if (isNaN(ticketId)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID.' });
      return 
    }

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded.' });
      return 
    }

    if (!uploaderUserId) {
      // ควรไม่เกิดขึ้นถ้า authenticateToken ทำงานถูกต้อง
      res.status(401).json({ success: false, message: 'User not authenticated.' });
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
      const isAssignee = ticket.assignee_id === uploaderUserId;
      const userRole = req.user?.role; // สมมติว่า role อยู่ใน req.user
      const isAdminOrOfficer = userRole === 'ADMIN' || userRole === 'OFFICER';

      if (!(isAssignee || isAdminOrOfficer)) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to attach files to this ticket as an assignee.' });
        return 
      }

      const result = await addAssigneeFilesToTicket(ticketId, files, uploaderUserId);

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
    const userId = req.user?.id; // User performing the action
    const userRole = req.user?.role;

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
      const isTicketAssignee = assigneeFile.ticket?.assignee_id === userId;
      const isUploader = assigneeFile.uploadedBy_id === userId;
      const isAdminOrOfficer = userRole === 'ADMIN' || userRole === 'OFFICER';

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

  console.log('ticket: ',ticketId)
  console.log('Status: ',status)

  if (!['open', 'in_progress', 'pending', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Invalid status specified' })
  }
  
  try {
    const updatedTicketStatus = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status as TicketStatus },
    });

    res.status(200).json({
      message: 'Status updated successfully',
      data: updatedTicketStatus,
    });
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
  const { userId } = req.body;
  const role = req.body.role;

  try {
    // เฉพาะ Admin หรือเจ้าของ token ที่เป็น userId นั้นเอง ถึงจะเปลี่ยนได้
    if (role !== "ADMIN" && req.body.id !== userId) {
      res.status(403).json({ error: "Unauthorized" });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignee_id: userId,
      },
      include: {
        assignee: true,
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign ticket" });
  }
});

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