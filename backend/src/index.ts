import express from 'express'
import dotenv from 'dotenv'
import routes from './routes'
import { authenticateToken } from '@/middleware/auth.middleware'
import userRoutes from '@/routes/user.routes'
import typeRoutes from '@/routes/tickettype.routes'
import ticketRoutes from '@/routes/tickets.routes'
import dashboardRoutes from '@/routes/dashboard.routes'
import departmentRoutes from '@/routes/department.routes'
import logRoutes from './routes/log.routes';
import path from 'path'

dotenv.config()

const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello Issue")
})


app.use('/api', routes)

app.get('/api/protected', authenticateToken, (req, res) => {
  // @ts-ignore
  try {
    // @ts-ignore
    res.json({ message: 'You have access', user: req.user })
  }catch (error) {
    res.status(500).json({ error: 'cant access this message at /src/index.ts'})
  }
})

//users
app.use('/api/users', userRoutes)

//ticet types
app.use('/api/types', typeRoutes)

//ticket 
app.use('/api/tickets', ticketRoutes)

// server uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

//dashvoard
app.use('/api/dashboard', dashboardRoutes)

//department 
app.use('/api/departments', departmentRoutes)

//log
app.use('/api/logs', logRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
