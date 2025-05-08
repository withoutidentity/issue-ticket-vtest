import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import jwt from 'jsonwebtoken'
import { error } from 'console'

export interface JwtPayload {
  id: number
  email: string
  role: "USER" | "OFFICER" | "ADMIN" | "BANNED"
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
  
}

const accessSecret = process.env.ACCESS_TOKEN_SECRET!

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
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
    // @ts-ignore
    req.user = user 
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
