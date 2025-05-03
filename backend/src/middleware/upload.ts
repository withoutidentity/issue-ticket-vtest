// middlewares/upload.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, uploadPath)
  },
  filename: function (_, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

export const upload = multer({ storage })
