import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware'
import { PrismaClient } from '@prisma/client'


const router = Router();
const prisma = new PrismaClient()
//GET /api/departments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
        select: {
            id: true,
            name: true
        }
    })
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// POST /api/departments/create
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    const { name } = req.body;

    const result = await prisma.department.create({
      data:{
        name
      }
  });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/delete/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Department ID'
      });
    }

    const result = await prisma.department.delete({
      where: {
        id: id
      }
    })
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/check/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const isUsed = await prisma.ticket.findFirst({ 
      where: { department_id: id } 
    });

    res.json({ isUsed: !!isUsed }); // ส่งกลับเป็น true/false
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
