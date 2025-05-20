import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

interface DepartmentPayload {
  id: number;
  name: string;
}

export interface UserJwtPayload {
  id: number
  name: string
  email: string
  department: DepartmentPayload | null
  role: 'USER' | 'OFFICER' | 'ADMIN' | 'BANNED'
  is_officer_confirmed?: boolean
}

interface UserPayload {
  id: number
  name: string
  email: string
  department: DepartmentPayload | null
  role: 'USER' | 'OFFICER' | 'ADMIN' | 'BANNED'
  is_officer_confirmed?: boolean
}

export function generateAccessToken(user: UserPayload): string {
  const payload: UserJwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
    is_officer_confirmed: user.is_officer_confirmed,
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
