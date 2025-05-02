import { Router } from 'express';
import { Request, Response } from 'express';
import {
  getAllTickets,
  createTicket,
  getTicketById,
  updateTicket,
  deleteTicket
} from '../services/ticket.service';

const router = Router();

// GET /api/tickets - ดึง Ticket ทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await getAllTickets();
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

// POST /api/tickets/create - สร้าง Ticket ใหม่
router.post('/create', async (req: Request, res: Response) => {
  try {
    if (!req.body.title) {
      res.status(400).json({
        success: false,
        message: 'Ticket title is required'
      });
    }

    const result = await createTicket({
      title: req.body.title,
      description: req.body.description,
      type_id: req.body.type_id,
      user_id: req.body.user_id
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

// GET /api/tickets/:id - ดึง Ticket โดย ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
    }

    const result = await getTicketById(id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/tickets/:id - อัปเดต Ticket
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
    }

    const result = await updateTicket(id, {
      title: req.body.title,
      description: req.body.description,
      type_id: req.body.type_id,
      status: req.body.status
    });
    
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

// DELETE /api/tickets/:id - ลบ Ticket
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
    }

    const result = await deleteTicket(id);
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