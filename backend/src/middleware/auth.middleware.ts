import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/utils/jwt'

interface AuthenticatedRequest extends Request {
  user?: any // หรือจะใช้เป็น type ที่ชัดเจน เช่น { id: string, role: string }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.sendStatus(401)
    return
  }

  try {
    const user = verifyAccessToken(token)
    req.user = user
    next()
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function authorizeRoles(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Access denied' })
      return
    }
    next()
  }
}
