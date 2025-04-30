import { Router } from 'express'
import { PrismaClient, Role } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()
import { Request, Response } from 'express'

// GET /api/types
router.get('/', async (req: Request, res: Response) => {
  try {
    const types = await prisma.ticket_types.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    })
    res.json(types)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Post /api/types/create
router.post('/create', async (req: Request, res: Response) => {
    try {
      const newTicketType = await prisma.ticket_types.create({
        data: {
          name: req.body.name,
          description: req.body.description || null,
        },
      });
      res.json({ 
        success: true,
        message: 'Ticket type created successfully',
        data: newTicketType,
      });
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

// Delete /api/types/delete/:id
router.delete('/delete/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    try {
        const deletedTicketType = await prisma.ticket_types.delete({
        where: { id },
        })
        res.json({ 
        success: true,
        message: 'Ticket type deleted successfully',
        data: deletedTicketType,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router