import { Router } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()
import { Request, Response } from 'express'

// GET /api/users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // เพิ่ม status หรือ createdAt ถ้ามี
      },
    })
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user role
// PUT /api/users/update/:id
router.put('/update/:id', authenticateToken, authorizeRoles(['ADMIN', 'OFFICER']), async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10)
  const { role } = req.body

  console.log('user: ',userId)
  console.log('Role: ',role)

  if (!['USER', 'OFFICER', 'ADMIN', 'BANNED'].includes(role)) {
    res.status(400).json({ error: 'Invalid role specified' })
  }
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: 'Failed to update user',
      error,
    });
  }

  // const updatedUser = {
  //   id: userId,
  //   role,
  //   updatedAt: new Date(),
  // };

  // console.log('user: ',updatedUser)
  // res.status(200).json({
  //   message: 'User updated successfully',
  //   data: updatedUser,
  // });

  // try {
  //   const updatedUser = await prisma.user.update({
  //     where: { id: userId },
  //     data: { role },
  //   })

  //   res.json(updatedUser)
  // } catch (error) {
  //   console.error('Failed to update user:', error)
  //   res.status(500).json({ error: 'Failed to update user' })
  // }
})

export default router
