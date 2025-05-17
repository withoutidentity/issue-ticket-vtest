// middlewares/upload.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// --- User Uploads ---
const userUploadPath = path.join(__dirname, '../../uploads/user')
if (!fs.existsSync(userUploadPath)) {
  fs.mkdirSync(userUploadPath, { recursive: true })
}

const userStorage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, userUploadPath)
  },
  filename: function (_, file, cb) {
    const now = new Date(); // Generate timestamp for each file
    const timePart = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`;
    // Decode a URI component that was previously created by encodeURIComponent or by a similar routine.
    // This helps ensure that original filenames with non-ASCII characters (like Thai) are preserved correctly.
    const originalnameDecoded = decodeURIComponent(Buffer.from(file.originalname, 'latin1').toString('utf8'));
    const uniqueName = `${timePart}-${originalnameDecoded}`;
    cb(null, uniqueName)
  },
})

// Multer instance for user files
export const uploadUser = multer({
  storage: userStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      // @ts-ignore
      cb(new Error('ประเภทไฟล์ไม่ถูกต้อง!'), false)
    }
  },
})

// --- Assignee Uploads ---
const assigneeUploadPath = path.join(__dirname, '../../uploads/assignee')
if (!fs.existsSync(assigneeUploadPath)) {
  fs.mkdirSync(assigneeUploadPath, { recursive: true })
}

const assigneeStorage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, assigneeUploadPath)
  },
  filename: function (_, file, cb) {
    const now = new Date(); // Generate timestamp for each file
    const timePart = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${now.getMilliseconds()}`;
    const originalnameDecoded = decodeURIComponent(Buffer.from(file.originalname, 'latin1').toString('utf8'));
    const uniqueName = `${timePart}-${originalnameDecoded}`;
    cb(null, uniqueName)
  },
})

// Multer instance for assignee files
export const uploadAssignee = multer({
  storage: assigneeStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB (can be different if needed)
  },
  fileFilter: (req, file, cb) => { // Same filter for now, can be customized
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      // @ts-ignore
      cb(new Error('ประเภทไฟล์ไม่ถูกต้อง!'), false)
    }
  },
})
