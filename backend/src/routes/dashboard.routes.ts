// routes/dashboard.routes.ts
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

router.get('/admin', authenticateToken, authorizeRoles(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    // Modify queries to exclude hidden tickets
    const totalTickets = await prisma.ticket.count({
      where: { is_hidden: false }
    });

    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
      where: { is_hidden: false } // Exclude hidden tickets
    })

    // Ensure all statuses are represented, even if count is 0
    const statusSummary = {
      total: totalTickets,
      open: statusCounts.find(s => s.status === 'open')?._count || 0,
      in_progress: statusCounts.find(s => s.status === 'in_progress')?._count || 0,
      closed: statusCounts.find(s => s.status === 'closed')?._count || 0,
    };

    const typeCounts = await prisma.ticket.groupBy({
      by: ['type_id'],
      _count: true,
    })

    const types = await prisma.ticket_types.findMany()

    const typeSummary = types.map(type => {
      const found = typeCounts.find(t => t.type_id === type.id)
      return {
        name: type.name,
        count: found?._count || 0
      }
    })

    res.json({ statusSummary, typeSummary })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
