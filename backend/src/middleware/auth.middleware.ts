import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import jwt from 'jsonwebtoken'
import { error } from 'console'

interface DepartmentPayload {
  id: number;
  name: string;
}

export interface JwtPayload {
  id: number
  email: string
  name: string
  role: "USER" | "OFFICER" | "ADMIN" | "BANNED"
  department: DepartmentPayload | null;
  is_officer_confirmed?: boolean;
}

interface UserJwtPayload extends JwtPayload {
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

const accessSecret = process.env.ACCESS_TOKEN_SECRET!

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'ไม่มี Token' })
    return
  }

  jwt.verify(token, accessSecret, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Access token หมดอายุ' }) // ให้ client รู้ว่าควร refresh
        return
      }
      res.status(403).json({ error: 'Token ผิดพลาด' })
      return
    }
    // Cast the decoded user to JwtPayload to ensure type safety
    const decodedUser = user as JwtPayload;
    // Assign all relevant properties from the decoded token to req.user
    req.user = {
      id: decodedUser.id,
      email: decodedUser.email,
      role: decodedUser.role,
      name: decodedUser.name,
      department: decodedUser.department || null,
      is_officer_confirmed: decodedUser.is_officer_confirmed ?? false, // Default to false if undefined/null
    };
    next()
  })
}

export function authorizeRoles(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbiddennnn: Access denied' })
      return
    }
    else if (req.user.role === 'BANNED') {
      throw new Error('บัญชีนี้ถูกระงับการใช้งาน')
    }
    next()
  }
}
