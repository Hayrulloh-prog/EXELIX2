import 'dotenv/config';

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiry: '30d',
  adminLogin: process.env.ADMIN_LOGIN || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  hcaptchaSecret: process.env.HCAPTCHA_SECRET || '',
  hcaptchaSiteKey: process.env.HCAPTCHA_SITEKEY || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  vapidPublic: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivate: process.env.VAPID_PRIVATE_KEY || '',
  senderLimitRegular: 3,
  senderLimitCritical: 2,
  ownerLimitPerDay: 10,
  sendDelaySeconds: 4,
  siteUrl: process.env.SITE_URL || process.env.API_URL || 'http://localhost:5173',
};
