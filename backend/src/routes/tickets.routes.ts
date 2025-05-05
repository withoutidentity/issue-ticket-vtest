import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload'

const router = Router()
const prisma = new PrismaClient()

// POST /api/tickets/create
router.post(
  '/create',
  authenticateToken,
  upload.array('files', 5), // รับไฟล์แนบสูงสุด 5 ไฟล์
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, type_id, priority, contact, department } =
        req.body

      const files = req.files as Express.Multer.File[]

      const newTicket = await prisma.ticket.create({
        data: {
          title,
          description,
          type_id: parseInt(type_id),
          priority,
          contact,
          department,
          user_id: req.user!.id,
          files: {
            create: files.map((file) => ({
              filename: file.originalname,
              filepath: file.path,
            })),
          },
        },
        include: {
          ticket_types: true,
          files: true,
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
      },
      orderBy: { created_at: 'asc' },
    })

    res.json(tickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch tickets' })
  }
})


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