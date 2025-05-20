import { Router } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()
import { Request, Response } from 'express'

// GET /api/users
router.get('/',authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        is_officer_confirmed: true
        // เพิ่ม status หรือ createdAt ถ้ามี
      },
    })
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

 // GET /api/users/officer
router.get("/officer", authenticateToken, async (req: Request, res: Response) => {
  try {
    const officer = await prisma.user.findMany({
      where: { role: "OFFICER" },
      select: {
        id: true,
        name: true,
      },
    });

    res.json(officer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

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

// PATCH /api/users/:userId/confirm-officer - Confirm an officer account
router.patch('/:userId/confirm-officer', authenticateToken, authorizeRoles(['ADMIN', 'OFFICER']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userIdToConfirm = parseInt(req.params.userId, 10);
  const performingUser = req.user; // User performing the action (from authenticateToken middleware)
  console.log('performingUser: ',performingUser)


  if (isNaN(userIdToConfirm)) {
    res.status(400).json({ error: 'Invalid user ID format.' });
    return 
  }

  // If the performing user is an OFFICER, they must be confirmed themselves
  if (performingUser?.role === Role.OFFICER && !performingUser.is_officer_confirmed) {
    res.status(403).json({ error: 'Forbidden: Your officer account is not confirmed. You cannot confirm other officers.' });
    return 
  }

  // Prevent users from confirming themselves (though an admin could still do it via this route if not checked)
  if (performingUser?.id === userIdToConfirm && performingUser?.role === Role.OFFICER) {
    res.status(400).json({ error: 'Officers cannot confirm their own accounts through this action.' });
    return
  }

  try {
    const officerToConfirm = await prisma.user.findUnique({
      where: { id: userIdToConfirm },
    });

    if (!officerToConfirm) {
      res.status(404).json({ error: 'User not found.' });
      return 
    }

    if (officerToConfirm.role !== Role.OFFICER) {
      res.status(400).json({ error: 'This user is not an Officer and cannot be confirmed as such.' });
      return 
    }

    if (officerToConfirm.is_officer_confirmed) {
      res.status(400).json({ error: 'Officer account is already confirmed.' });
      return 
    }

    const confirmedOfficer = await prisma.user.update({
      where: { id: userIdToConfirm },
      data: { is_officer_confirmed: true },
      select: { // Select only necessary fields for the response
        id: true,
        name: true,
        email: true,
        role: true,
        is_officer_confirmed: true,
        department: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({ message: 'Officer account confirmed successfully.', user: confirmedOfficer });
  } catch (error) {
    console.error('Error confirming officer:', error);
    res.status(500).json({ error: 'Failed to confirm officer account.' });
  }
});

export default router
