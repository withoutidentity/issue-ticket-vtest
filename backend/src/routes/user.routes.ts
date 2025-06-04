import { Router } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.middleware'
import multer from 'multer';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs/promises'; // For async file operations

const router = Router()
const prisma = new PrismaClient()
import { Request, Response } from 'express'

// Multer storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/avatars'); // Path relative to backend/src/routes, resolves to backend/uploads/avatars
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error: any) {
      console.error("Failed to create avatar directory:", error);
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `user-${userId}-avatar-${uniqueSuffix}${extension}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes) as any);
  }
});

// GET /api/users
router.get('/',authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar_url: true,
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

// GET /api/users/me - Get currently logged-in user's profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id; // Get user ID from authenticated token

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return 
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar_url: true, // Include avatar_url
        is_officer_confirmed: true, // Added from previous diff
        department: { select: { id: true, name: true } }, // Added from previous diff
      },
    });
    if (!user) res.status(404).json({ error: 'User not found' });
    res.json(user);
    return 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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

// PUT /api/users/me/avatar - Update currently logged-in user's avatar
router.put(
  '/me/avatar',
  authenticateToken,
  avatarUpload.single('avatar'), // 'avatar' is the field name in FormData
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return 
    }
    if (!req.file) {
      res.status(400).json({ error: 'No avatar file uploaded.' });
      return 
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return 
      }

      // Delete old avatar if it exists and is not null/empty
      if (user.avatar_url) {
        // Construct absolute path to old avatar. Assumes avatar_url is like 'uploads/avatars/filename.jpg'
        // and files are served from /uploads base. The avatar_url is relative to that base.
        const oldAvatarAbsolutePath = path.join(__dirname, '../../', user.avatar_url);
        try {
          await fs.access(oldAvatarAbsolutePath); // Check if file exists
          await fs.unlink(oldAvatarAbsolutePath);
        } catch (error: any) {
          if (error.code !== 'ENOENT') { // ENOENT = file not found, ignore
            console.warn(`Could not delete old avatar ${oldAvatarAbsolutePath}:`, error.message);
          }
        }
      }

      const relativeAvatarPath = path.join('/uploads/avatars', req.file.filename).replace(/\\/g, '/');

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: relativeAvatarPath },
        select: { id: true, name: true, email: true, role: true, is_officer_confirmed: true, avatar_url: true },
      });

      res.json({ message: 'Avatar updated successfully', user: updatedUser });
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      // Attempt to clean up the uploaded file if an error occurred after upload
      if (req.file && req.file.path) {
        try { await fs.unlink(req.file.path); } catch (e) { console.error("Error cleaning up avatar on failure:", e); }
      }
      res.status(500).json({ error: 'Failed to update avatar.', details: error.message });
    }
  }
);

// PUT /api/users/me - Update currently logged-in user's profile (name, email)
router.put('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id; // Get user ID from authenticated token
  const { name, email } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return 
  }

  // Basic validation
  if (name === undefined && email === undefined) {
    res.status(400).json({ error: 'No update data provided' });
    return 
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }), // Only update name if provided
        ...(email !== undefined && { email }), // Only update email if provided
      },
      select: { id: true, name: true, email: true, role: true, is_officer_confirmed: true, avatar_url: true }, // Return updated fields
    });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/users/me/password - Change currently logged-in user's password
router.put('/me/password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }, // Only fetch ID and password_hash
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password || ''); // Handle potential null password_hash
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Incorrect current password.' });
      return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10); // Generate a salt
    const newPasswordHash = await bcrypt.hash(newPassword, salt); // Hash the new password

    // Update password_hash in the database
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password.' });
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

})

// PATCH /api/users/:userId/confirm-officer - Confirm an officer account
router.patch('/:userId/confirm-officer', authenticateToken, authorizeRoles(['ADMIN', 'OFFICER']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userIdToConfirm = parseInt(req.params.userId, 10);
  const performingUser = req.user; // User performing the action (from authenticateToken middleware)
  // console.log('performingUser: ',performingUser)


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
