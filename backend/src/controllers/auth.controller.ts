import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const accessSecret = process.env.ACCESS_TOKEN_SECRET!
const refreshSecret = process.env.REFRESH_TOKEN_SECRET!

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  })
  res.json({ message: 'User registered', user })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.status(401).json({ error: 'Invalid credentials' })

  const accessToken = jwt.sign({ id: user.id, role: user.role }, accessSecret, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' })

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  })

  res.json({ accessToken, refreshToken })
}

export const refresh = async (req: Request, res: Response) => {
  const { token } = req.body
  try {
    const payload = jwt.verify(token, refreshSecret)

    if (typeof payload !== 'object' || !('id' in payload)) {
      return res.status(403).json({ error: 'Invalid token payload' })
    }

    const user = await prisma.user.findUnique({ where: { id: (payload as any).id } })
    if (!user || user.refreshToken !== token) return res.status(403).json({ error: 'Invalid token' })

    const newAccessToken = jwt.sign({ id: user.id, role: user.role }, accessSecret, { expiresIn: '15m' })

    // OPTIONAL: rotate refresh token
    // const newRefreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: '7d' })
    // await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } })

    res.json({
      accessToken: newAccessToken,
      // refreshToken: newRefreshToken
    })
  } catch (err) {
    console.error('Refresh token error:', err)
    res.status(403).json({ error: 'Invalid token' })
  }
}