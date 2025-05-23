import express from 'express'
import authRoutes from './auth.routes'
import fileRoutes from './file.routes' // 1. Import fileRoutes

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/uploads/user', fileRoutes) // 2. Mount fileRoutes ที่ path นี้

export default router