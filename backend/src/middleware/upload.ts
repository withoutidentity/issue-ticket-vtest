// middlewares/upload.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { error } from 'console'

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

// ✅ รวมทั้ง limits และ fileFilter ไว้ใน export นี้เลย
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('ประเภทไฟล์ไม่ถูกต้อง!'))
    }
  },
})
