// src/utils/sendTelegram.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); //โหลดค่าจาก .env

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('ไม่พบ TELEGRAM_BOT_TOKEN ใน .env');
}


export async function sendTelegramMessage(chatId: string, message: string, message_thread_id?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload: any = {
    chat_id: chatId,
    text: message,
  };

  if (message_thread_id) {
    payload.message_thread_id = message_thread_id;
  }

  try {
    await axios.post(url, payload);
  } catch (error) {
    console.error('Telegram Error:', error)
  }
}
