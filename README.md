# Issue Ticket System

## 1. อธิบายโปรเจคนี้

Issue Ticket System เป็นระบบแจ้งปัญหาและติดตามงานแบบ Full Stack แบ่งเป็น 2 ส่วนหลักคือ `frontend` สำหรับหน้าจอผู้ใช้งาน และ `backend` สำหรับ API, authentication, database และระบบแจ้งเตือน เหมาะสำหรับองค์กรหรือทีมที่ต้องการรับเรื่องปัญหา มอบหมายผู้รับผิดชอบ ติดตามสถานะ และดูสรุปภาพรวมของ Ticket

## 2. Tech Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT, Refresh Token, bcrypt
- Realtime: Socket.IO
- File Upload: Multer
- Notification: WebSocket, Email, Telegram Bot
- Chart/Export: Chart.js, SheetJS xlsx

## 3. Feature

- สมัครสมาชิก เข้าสู่ระบบ และจัดการ token อัตโนมัติ
- แยกสิทธิ์ผู้ใช้งานตาม role: `USER`, `OFFICER`, `ADMIN`, `BANNED`
- สร้าง Ticket พร้อมแนบไฟล์และเลขอ้างอิง Ticket
- ติดตามสถานะ Ticket เช่น `open`, `in_progress`, `pending`, `closed`
- มอบหมายผู้รับผิดชอบ Ticket
- จัดการประเภท Ticket, แผนก และผู้ใช้งาน
- Dashboard สรุปจำนวน Ticket ตามสถานะและประเภท
- ระบบแจ้งเตือนแบบ real-time ผ่าน Socket.IO
- แจ้งเตือนผ่าน Telegram และ Email สำหรับบาง workflow
- ประวัติการเปลี่ยนแปลง Ticket และไฟล์แนบ
- รีเซ็ตรหัสผ่านและเปลี่ยนรหัสผ่าน

## 4. Installation & Setup

### Clone the repository:

```bash
git clone https://github.com/your-username/issue-ticket-vtest.git
cd financial-news-dashboard
```

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Backend

```bash
cd backend
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend` และตั้งค่าตัวแปรหลัก:

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
```

เตรียมฐานข้อมูลและรัน backend:

```bash
npx prisma migrate dev
npm run dev
```

Backend จะทำงานที่ `http://localhost:3000` หากไม่ได้กำหนด `PORT`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend จะทำงานที่ `http://localhost:5173`

หากรัน backend ในเครื่อง ให้ปรับ API URL ใน `frontend/src/api/axios-instance.ts` และ `frontend/src/config.ts` ให้ชี้ไปที่ backend local เช่น `http://localhost:3000`
