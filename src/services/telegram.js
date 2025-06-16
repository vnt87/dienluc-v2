const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Outage = require('../models/outage');

const TELEGRAM_API_BASE = 'https://tele.kenhnhacnew.workers.dev/bot';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NOTIFY_FILE = path.join(__dirname, '../../last_telegram_notify.txt');

function getTodayString() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // yyyy-mm-dd
}

function readLastNotifyInfo() {
  try {
    const content = fs.readFileSync(NOTIFY_FILE, 'utf8').trim();
    const [date, count] = content.split('|');
    return { date, count: parseInt(count, 10) || 0 };
  } catch {
    return { date: '', count: 0 };
  }
}

function writeLastNotifyInfo(dateStr, count) {
  fs.writeFileSync(NOTIFY_FILE, `${dateStr}|${count}`, 'utf8');
}

async function sendOutageNotification(outage) {
  const province = outage.province || '';
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;
  const provinceParam = encodeURIComponent(province).replace(/%20/g, '+');
  const detailUrl = `https://dienluc.net`;
  const message = `🔊 Lịch cắt điện mới cập nhật. (Ngày: ${dateStr})\n⚡Có lịch cắt điện mới rồi, cập nhật thông tin ngay thôi nào.\n--------\n✔️ Xem lịch cắt điện ở ${province} tại: ${detailUrl}`;

  try {
    const url = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('Telegram notification sent successfully');
  } catch (error) {
    console.error('Error sending Telegram notification:', error.response?.data || error.message);
  }
}

async function checkAndNotifyNewOutages() {
  const today = getTodayString();
  const { date: lastNotifyDate, count: lastNotifyCount } = readLastNotifyInfo();
  let notifyCount = 0;
  if (lastNotifyDate === today) {
    notifyCount = lastNotifyCount;
    if (notifyCount >= 10) {
      console.log('Telegram notification sent 10 times today. Skip.');
      return;
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const newOutages = await Outage.find({
    createdAt: { $gte: oneHourAgo }
  });

  if (newOutages.length > 0) {
    await sendOutageNotification(newOutages[0]);
    writeLastNotifyInfo(today, notifyCount + 1);
  } else {
    console.log('No new outages to notify.');
  }
}

module.exports = {
  sendOutageNotification,
  checkAndNotifyNewOutages
}; 