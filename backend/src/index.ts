import express from 'express'
import dotenv from 'dotenv'
import routes from './routes'
import { authenticateToken } from '@/middleware/auth.middleware'

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
  res.json({ message: 'You have access', user: req.user })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
