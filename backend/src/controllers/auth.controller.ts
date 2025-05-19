import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { connect } from 'http2'
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
    departmentId: user.department?.id, // Include departmentId if user has one
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
      departmentId: user.department?.id,
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