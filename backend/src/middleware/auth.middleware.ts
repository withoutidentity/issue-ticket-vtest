import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: number
  email: string
  role: "USER" | "OFFICER" | "ADMIN" | "BANNED"
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
  
}

const accessSecret = process.env.ACCESS_TOKEN_SECRET!

export function authenticateToken (req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.sendStatus(401)
    return
  }

  jwt.verify(token, accessSecret, (err, user) => {
    if (err) {
      res.sendStatus(403)
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
      res.status(403).json({ error: 'Forbidden: Access denied' })
      return
    }
    else if (req.user.role === 'BANNED') {
      throw new Error('บัญชีนี้ถูกระงับการใช้งาน')
    }
    next()
  }
}
