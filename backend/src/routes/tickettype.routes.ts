import { Router } from 'express';
import { Request, Response } from 'express';
import {
  getAllTicketTypes,
  createTicketType,
  deleteTicketType
} from '../services/tickettype.service';
import { authenticateToken } from '../middleware/auth.middleware'


const router = Router();

// GET /api/types - ดึงประเภท Ticket ทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await getAllTicketTypes();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/types/create - สร้างประเภท Ticket ใหม่
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      res.status(400).json({
        success: false,
        message: 'Ticket type name is required'
      });
    }

    const result = await createTicketType({
      name: req.body.name,
      description: req.body.description
    });
    
    res.status(result.success ? 201 : 500).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/types/delete/:id - ลบประเภท Ticket
router.delete('/delete/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket type ID'
      });
    }

    const result = await deleteTicketType(id);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;