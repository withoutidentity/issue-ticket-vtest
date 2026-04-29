# Frontend - Issue Ticket System

## 1. อธิบายโปรเจคนี้

Frontend เป็นส่วนหน้าจอของระบบ Issue Ticket System พัฒนาด้วย Vue 3 และ Vite ใช้สำหรับให้ผู้ใช้สร้าง Ticket, ติดตามสถานะ, ดูรายละเอียดงาน, รับแจ้งเตือน และให้เจ้าหน้าที่หรือผู้ดูแลระบบจัดการ Ticket ผ่านหน้า dashboard

## 2. Tech Stack

- Vue 3
- Vite
- TypeScript / JavaScript
- Vue Router
- Pinia และ Pinia Persisted State
- Axios
- Tailwind CSS
- Socket.IO Client
- Chart.js และ vue-chartjs
- SweetAlert2
- SheetJS xlsx

## 3. Feature

- Login, Register, Forgot Password และ Reset Password
- Role-based route guard สำหรับ `USER`, `OFFICER`, `ADMIN`
- สร้างและดูรายละเอียด Ticket
- หน้ารายการ Ticket สำหรับเจ้าหน้าที่และผู้ดูแลระบบ
- หน้า My Tickets สำหรับติดตาม Ticket ของผู้ใช้
- Dashboard แสดงสรุปและกราฟ
- จัดการผู้ใช้ แผนก และประเภท Ticket
- Profile และ Change Password
- แจ้งเตือนแบบ real-time ผ่าน Socket.IO
- แนบไฟล์และดูไฟล์ที่เกี่ยวข้องกับ Ticket

## 4. Installation & Setup

ติดตั้ง dependencies:

```bash
npm install
```

รันโหมด development:

```bash
npm run dev
```

Build สำหรับ production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

ค่า API URL ถูกตั้งไว้ในไฟล์ `src/api/axios-instance.ts` และ `src/config.ts` หากต้องการใช้งานกับ backend local ให้เปลี่ยน URL เป็น `http://localhost:3000` และ `http://localhost:3000/api` ตามตำแหน่งที่ใช้งาน
