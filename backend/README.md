# Backend - Issue Ticket System

## 1. อธิบายโปรเจคนี้

Backend เป็น API Server ของระบบ Issue Ticket System พัฒนาด้วย Node.js, Express และ TypeScript ใช้สำหรับจัดการ authentication, ticket, user, department, notification, file upload และเชื่อมต่อฐานข้อมูล PostgreSQL ผ่าน Prisma ORM

## 2. Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT และ Refresh Token
- bcrypt
- Socket.IO
- Multer
- Nodemailer
- Telegram Bot API
- date-fns

## 3. Feature

- สมัครสมาชิก เข้าสู่ระบบ refresh token และ reset password
- ตรวจสอบสิทธิ์ด้วย JWT middleware
- จำกัดสิทธิ์ตาม role: `USER`, `OFFICER`, `ADMIN`, `BANNED`
- CRUD และ workflow สำหรับ Ticket
- สร้างเลขอ้างอิง Ticket อัตโนมัติ
- แนบไฟล์จากผู้แจ้งและผู้รับผิดชอบ
- บันทึกประวัติการเปลี่ยนแปลง Ticket
- จัดการประเภท Ticket, แผนก และผู้ใช้งาน
- Dashboard API สำหรับสรุปข้อมูล Ticket
- ระบบ notification ในฐานข้อมูลและ real-time ผ่าน Socket.IO
- ส่ง Email สำหรับ reset password
- ส่ง Telegram notification ตามการตั้งค่าแผนก
- Serve frontend production build จาก `frontend/dist`

## 4. Installation & Setup

ติดตั้ง dependencies:

```bash
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
FRONTEND_URL="http://localhost:5173"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=465
EMAIL_SECURE="true"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-app-password"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
PORT=3000
```

สร้าง Prisma Client และ migrate database:

```bash
npx prisma generate
npx prisma migrate dev
```

รัน development server:

```bash
npm run dev
```

รัน server แบบ start:

```bash
npm start
```

API หลักจะอยู่ใต้ path `http://localhost:3000/api` เช่น `/api/auth`, `/api/tickets`, `/api/users`, `/api/departments`, `/api/dashboard` และ `/api/notifications`
