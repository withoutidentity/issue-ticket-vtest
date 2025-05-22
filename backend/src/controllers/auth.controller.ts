import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { PrismaClient, User } from '@prisma/client'
import { connect } from 'http2'
import crypto from 'crypto'; // สำหรับสร้าง token
import { sendPasswordResetEmail } from '../services/email.service'; // import service ส่งอีเมล
const prisma = new PrismaClient()

const accessSecret = process.env.ACCESS_TOKEN_SECRET!
const refreshSecret = process.env.REFRESH_TOKEN_SECRET!

export const register = async (req: Request, res: Response) => {
  const { email, password, name, role, department_id } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists.' })
  }

  const hashed = await bcrypt.hash(password, 10)

  const userData: any = {
    email,
    password: hashed,
    name,
    role: role || 'USER', // Default to USER if role is not provided
    department_id,
  }

  if (userData.role === 'OFFICER') {
    if (!department_id) {
      return res.status(400).json({ error: 'Department is required for Officer role.' })
    }
    userData.department_id = parseInt(department_id, 10) // Ensure department_id is an integer
    // Consider adding a status like 'PENDING_APPROVAL' here if implementing officer approval workflow
  }

  const user = await prisma.user.create({ data: userData })
  res.status(201).json({ message: 'User registered successfully. Please log in.', userId: user.id })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      name: true, //เพิ่ม name ด้วย
      is_officer_confirmed: true,
      department: { // Include department details
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  if (user.role === 'OFFICER' && !user.is_officer_confirmed) {
    return res.status(403).json({ error: 'Officer account not confirmed. Please wait for admin approval.' });
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const userPayloadForToken = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email, // Frontend authStore might use this from token if user object isn't fully parsed yet
    department: user.department, // Include the full department object or null
    is_officer_confirmed: user.is_officer_confirmed,
  }

  const accessToken = jwt.sign(userPayloadForToken, accessSecret, { expiresIn: '1h' }) // Increased expiry for convenience
  const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' })

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } })

  res.json({ accessToken, refreshToken, user })
}

export const refresh = async (req: Request, res: Response) => {
  const { token } = req.body
  
  try {
    const payload = jwt.verify(token, refreshSecret)
    // console.log('🔁 Received refresh token:', token)

    if (typeof payload !== 'object' || !('id' in payload)) {
      return res.status(403).json({ error: 'Invalid token payload' })
    }

    const userId = (payload as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { // Select all necessary fields to reconstruct the user object for the response
        id: true,
        email: true,
        password: true, // Needed for bcrypt compare if re-validating, but not for JWT refresh typically
        role: true,
        name: true,
        refreshToken: true,
        is_officer_confirmed: true, // ดึงสถานะการยืนยัน
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        // Include status if you have it:
        // status: true,
      }
    })

    if (!user || user.refreshToken !== token) return res.status(403).json({ error: 'Invalid token' })
    
    if (user.role === 'OFFICER' && !user.is_officer_confirmed) {
      return res.status(403).json({ error: 'Officer account not confirmed. Access denied.' });
    }

    const userPayloadForToken = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      department: user.department, // Include the full department object or null
      is_officer_confirmed: user.is_officer_confirmed, // Ensure this is included
    }
    const newAccessToken = jwt.sign(userPayloadForToken, accessSecret, { expiresIn: '1h' })

    // OPTIONAL: rotate refresh token
    // const newRefreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' })
    // await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } })

    // Send back the new access token and the user object (without password and refreshToken)
    const { password: _password, refreshToken: _refreshToken, ...userResponse } = user;
    res.json({ accessToken: newAccessToken, user: userResponse /*, refreshToken: newRefreshToken (if rotating) */ })
  } catch (err) {
    console.error('Refresh token error:', err)
    res.status(403).json({ error: 'Invalid token' })
  }
}

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return 
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // ลบ token เก่า (ถ้ามี) ของ user คนนี้ก่อน เพื่อให้มี token ที่ใช้งานได้เพียงอันเดียว
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const resetToken = crypto.randomBytes(32).toString('hex');
      // Hash token ก่อนเก็บลง DB เพื่อความปลอดภัย
      const hashedToken = await bcrypt.hash(resetToken, 10);

      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Token หมดอายุใน 1 ชั่วโมง

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashedToken,
          expiresAt: expiryDate,
        },
      });

      // ส่งอีเมลพร้อม plain token (resetToken) ไม่ใช่ hashedToken
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    }

    // ส่ง response เดียวกันเสมอเพื่อป้องกันการเดาอีเมลที่มีในระบบ
    res.status(200).json({ message: 'If your email is registered, you will receive a password reset link.' });
    return 

  } catch (error) {
    console.error('Error requesting password reset:', error);
    // ไม่ควรเปิดเผย error จริงใน production
    res.status(500).json({ message: 'An error occurred while processing your request.' });
    return 
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ error: 'Token and new password are required.' });
    return 
  }

  // (Optional but Recommended) Add password strength validation here
  // e.g., if (password.length < 8) return  res.status(400).json({ error: 'Password too short.' });
  const minPasswordLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!(password.length >= minPasswordLength && hasUppercase && hasLowercase && hasNumber)) {
    res.status(400).json({
      error: `Password must be at least ${minPasswordLength} characters long and include uppercase, lowercase, and a number.`,
    });
    return 
  }

  try {
    // ค้นหา token ที่ยังไม่หมดอายุทั้งหมดก่อน
    // แล้วค่อยมา verify ทีละตัวด้วย bcrypt.compare
    // เพราะเราไม่สามารถ query token ที่ hash แล้วด้วย plain token โดยตรงได้
    const potentialTokenEntries = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Token ยังไม่หมดอายุ
        },
      },
    });

    let validTokenEntry = null;
    for (const entry of potentialTokenEntries) {
      const isTokenMatch = await bcrypt.compare(token, entry.tokenHash);
      if (isTokenMatch) {
        validTokenEntry = entry;
        break;
      }
    }

    if (!validTokenEntry) {
      res.status(400).json({ error: 'Invalid or expired token.' });
      return 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: validTokenEntry.userId },
      data: { password: hashedPassword },
    });

    // ลบ token ที่ใช้แล้ว
    await prisma.passwordResetToken.delete({ where: { id: validTokenEntry.id } });

    res.status(200).json({ message: 'Password has been reset successfully.' });
    return 

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'An error occurred while resetting your password.' });
    return 
  }
};