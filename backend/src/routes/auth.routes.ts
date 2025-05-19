import express from 'express'
import * as AuthController from '@/controllers/auth.controller'
import type { RequestHandler } from 'express'

const router = express.Router()

router.post('/register', AuthController.register as RequestHandler)
router.post('/login', AuthController.login as RequestHandler)
router.post('/refresh', AuthController.refresh as RequestHandler)

export default router

