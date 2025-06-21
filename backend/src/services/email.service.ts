import nodemailer from 'nodemailer';

// ตั้งค่า transporter โดยดึงค่ามาจาก environment variables
// คุณจะต้องตั้งค่า EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS ในไฟล์ .env ของคุณ
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // เช่น 'smtp.gmail.com'
  port: parseInt(process.env.EMAIL_PORT || '587', 10), // เช่น 587 หรือ 465
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // อีเมลผู้ส่ง
    pass: process.env.EMAIL_PASS, // รหัสผ่านอีเมลผู้ส่ง หรือ App Password
  },
  logger: true,
  debug: true,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"Issue Ticket System" <${process.env.EMAIL_USER}>`, // ชื่อผู้ส่งและอีเมล
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending email to ${options.to}:`, error);
    // ใน production อาจจะต้องมีการ logging ที่ดีกว่านี้ หรือ retry mechanism
    throw new Error('Failed to send email.');
  }
};

export const sendPasswordResetEmail = async (to: string, name: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'คำขอรีเซ็ตรหัสผ่านสำหรับ Issue Ticket System';
  const html = `
    <p>สวัสดีคุณ ${name},</p>
    <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
    <p><a href="${resetUrl}" target="_blank">รีเซ็ตรหัสผ่านของคุณ</a></p>
    <p>หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ กรุณาเพิกเฉยต่ออีเมลนี้ ลิงก์นี้จะหมดอายุภายใน 30 นาที</p>
    <p>ขอบคุณครับ,<br>ทีมงาน Issue Ticket System</p>`;
  await sendEmail({ to, subject, html });
};