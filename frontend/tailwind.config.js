// d:\project\project-intern\issue-ticket-vtest\frontend\tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // ตรวจสอบให้แน่ใจว่าครอบคลุมไฟล์ทั้งหมดของคุณ
  ],
  theme: {
    extend: {
      fontFamily: {
        // ตั้ง Sarabun เป็นฟอนต์แรกในกลุ่ม sans-serif
        // Tailwind จะใช้ฟอนต์นี้สำหรับ utility classes เช่น font-sans, text-sm, ฯลฯ
        sans: ['Sarabun', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
