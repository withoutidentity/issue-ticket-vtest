import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware'
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()
// /api/departments
router.get('/', async (req: Request, res: Response) => {
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

export default router;
