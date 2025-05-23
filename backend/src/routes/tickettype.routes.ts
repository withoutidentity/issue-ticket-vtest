import { Router } from 'express';
import { Request, Response } from 'express';
import {
  getAllTicketTypes,
  createTicketType,
  deleteTicketType,
  updateTicketType // Import the new service function
} from '../services/tickettype.service';
import { authenticateToken } from '../middleware/auth.middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
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
      return 
    }

    const result = await createTicketType({
      name: req.body.name,
      description: req.body.description
    });

    res.status(result.success ? 201 : 500).json(result);
  } catch (error) {
    console.error('Error in POST /api/types/create route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 
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
      return 
    }

    const result = await deleteTicketType(id);
    res.status(result.success ? (result.message.includes('Cannot delete') ? 400 : 200) : 500).json(result);
    return 
  } catch (error) {
    console.error('Error in DELETE /api/types/delete/:id route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 
  }
});

// สร้าง API ตรวจสอบการใช้งาน type
// GET /api/types/check/:id
router.get('/check/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const isUsed = await prisma.ticket.findFirst({ 
      where: { type_id: id } 
    });

    res.json({ isUsed: !!isUsed }); // ส่งกลับเป็น true/false
    return 
  } catch (error) {
    console.error('Error in GET /api/types/check/:id route:', error);
    res.status(500).json({ error: 'Server error' });
    return 
  }
});

// PUT /api/types/update/:id - อัปเดตประเภท Ticket
router.put('/update/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket type ID format'
      });
      return 
    }

    // Construct data to update. Only include fields that are present in the request.
    const dataToUpdate: { name?: string; description?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Ticket type name cannot be empty if provided.'
        });
        return 
      }
      dataToUpdate.name = name;
    }

    if (description !== undefined) {
      // Allow description to be an empty string or null
      dataToUpdate.description = description;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No data provided for update. Please provide name and/or description.'
      });
      return 
    }

    const result = await updateTicketType(id, dataToUpdate);

    const statusCode = result.success ? 200 : (result.message.includes('not found') ? 404 : 400);
    res.status(statusCode).json(result);
    return 

  } catch (error) {
    console.error('Error in PUT /api/types/update/:id route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in update route',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 
  }
});

export default router;