// backend/src/services/auth.service.ts

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'
import {
  generateAccessToken,
  generateRefreshToken,
} from '@/utils/jwt'

const prisma = new PrismaClient()

interface RegisterInput {
  name: string
  email: string
  password: string
  role?: Role
}

interface LoginInput {
  email: string
  password: string
}

export async function register({ name, email, password, role = 'USER' }: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new Error('Email is already registered')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  })

  return {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
  }
}

export async function login({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password')
  }

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  // Save refresh token (optional)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
  }
}
