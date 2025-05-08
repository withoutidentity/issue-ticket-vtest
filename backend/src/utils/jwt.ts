import jwt from 'jsonwebtoken'
import { User } from '@/generated/prisma'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

export interface UserJwtPayload {
  id: number
  email: string
  role: 'USER' | 'OFFICER' | 'ADMIN' | 'BANNED'
}

interface UserPayload {
  id: number
  email: string
  role: 'USER' | 'OFFICER' | 'ADMIN' | 'BANNED'
}

export function generateAccessToken(user: UserPayload): string {
  const payload: UserJwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '3m' })
}

export function generateRefreshToken(user: { id: number }): string {
  const payload = { id: user.id }
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): UserJwtPayload {
  return jwt.verify(token, JWT_SECRET) as UserJwtPayload
}

export function verifyRefreshToken(token: string): { id: number } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number }
}
