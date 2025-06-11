import express from 'express'
import dotenv from 'dotenv'
import routes from './routes'
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { authenticateToken } from '@/middleware/auth.middleware'
import userRoutes from '@/routes/user.routes'
import typeRoutes from '@/routes/tickettype.routes'
import ticketRoutes from '@/routes/tickets.routes'
import dashboardRoutes from '@/routes/dashboard.routes'
import departmentRoutes from '@/routes/department.routes'
import logRoutes from './routes/log.routes';
import notificationRoutes from './routes/notification.routes'
import path from 'path'
import history from 'connect-history-api-fallback'

dotenv.config()

const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // ระวังใน production!
  },
});

// ⏫ Map เก็บ socket.id ของผู้ใช้แต่ละคน
const connectedUsers = new Map<number, string>();

// ⏫ จัดการการเชื่อมต่อของ client
io.on('connection', (socket) => {
  // console.log('Client connected:', socket.id);

  socket.on('register', (userId: number) => {
    connectedUsers.set(userId, socket.id);
    // console.log(`📌 Registered user ${userId} with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, sid] of connectedUsers.entries()) {
      if (sid === socket.id) {
        connectedUsers.delete(userId);
        // console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  });
});

app.get("/test", (req, res) => {
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
// Serve static files from the 'uploads' directory inside 'backend'
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))) // __dirname is backend/src, so ../uploads points to backend/uploads

//dashvoard
app.use('/api/dashboard', dashboardRoutes)

//department 
app.use('/api/departments', departmentRoutes)

//log
app.use('/api/logs', logRoutes)

//notification
app.use('/api/notifications', notificationRoutes);

app.use(history({
  rewrites: [
    { from: /^\/api\/.*$/, to: (context) => context.parsedUrl.pathname || '/' }, // ยกเว้น API path
    { from: /^\/uploads\/.*$/, to: (context) => context.parsedUrl.pathname || '/' }, // ยกเว้น uploads
  ]
}))

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// 🟢 Export WebSocket instance ให้ routes ใช้
export { io, connectedUsers };

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
