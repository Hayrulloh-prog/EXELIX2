import webpush from 'web-push';
import TelegramBot from 'node-telegram-bot-api';
import config from '../config.js';

const TYPES = {
  blocking: { key: 'blocking', critical: false },
  wrong_place: { key: 'wrong_place', critical: false },
  alarm: { key: 'alarm', critical: false },
  evacuate: { key: 'evacuate', critical: true },
  minor_accident: { key: 'minor_accident', critical: false },
  serious_accident: { key: 'serious_accident', critical: true },
};

const TEXTS = {
  ru: {
    greeting: 'Здравствуйте, вам отправлено уведомление:',
    blocking: '🚗 Ваш автомобиль перекрывает проезд',
    wrong_place: '🅿️ Ваш автомобиль припаркован в неправильном месте',
    alarm: '🔔 Сработала сигнализация вашего автомобиля',
    evacuate: '🚨 Ваш автомобиль эвакуируют',
    minor_accident: '⚠️ Ваш автомобиль попал в небольшое ДТП',
    serious_accident: '🚨 Ваш автомобиль попал в серьёзное ДТП',
  },
  ky: {
    greeting: 'Салам, сизге билдирүү жөнөтүлдү:',
    blocking: '🚗 Сизиң унаасыңыз жолду жаап турат',
    wrong_place: '🅿️ Сизиң унаасыңыз туура эмес жерде токтоп турат',
    alarm: '🔔 Сизиң унаасыңыздын сигнализациясы иштеп кетти',
    evacuate: '🚨 Сизиң унаасыңыз эвакуацияланып жатат',
    minor_accident: '⚠️ Сизиң унаасыңыз кичинекей аварияга дуушар болду',
    serious_accident: '🚨 Сизиң унаасыңыз оор аварияга дуушар болду',
  },
  en: {
    greeting: 'Hello, you have received a notification:',
    blocking: '🚗 Your car is blocking the road',
    wrong_place: '🅿️ Your car is parked in the wrong place',
    alarm: '🔔 Your car alarm went off',
    evacuate: '🚨 Your car is being evacuated',
    minor_accident: '⚠️ Your car was in a minor accident',
    serious_accident: '🚨 Your car was in a serious accident',
  },
};

function getMessage(lang, typeKeys) {
  const t = TEXTS[lang] || TEXTS.ru;
  const lines = typeKeys.map((k) => TEXTS[lang]?.[k] || TEXTS.ru[k]).filter(Boolean);
  return `${t.greeting}\n\n${lines.join('\n')}`;
}

export function initPush() {
  if (config.vapidPublic && config.vapidPrivate) {
    webpush.setVapidDetails('mailto:exelix@localhost', config.vapidPublic, config.vapidPrivate);
  }
}

export async function sendPush(user, typeKeys) {
  if (!user.push_subscription || !config.vapidPrivate) return;
  try {
    const sub = JSON.parse(user.push_subscription);
    const msg = getMessage(user.lang || 'ru', typeKeys);
    await webpush.sendNotification(sub, msg);
  } catch (e) {
    console.warn('Push failed:', e.message);
  }
}

let bot = null;
if (config.telegramBotToken) {
  try {
    bot = new TelegramBot(config.telegramBotToken);
  } catch (e) {
    console.warn('Telegram bot init failed:', e.message);
  }
}

export async function sendTelegram(user, typeKeys) {
  if (!bot || !user.telegram) return;
  const to = user.telegram.startsWith('@') ? user.telegram : `@${user.telegram}`;
  const msg = getMessage(user.lang || 'ru', typeKeys);
  try {
    await bot.sendMessage(to, msg);
  } catch (e) {
    console.warn('Telegram send failed:', e.message);
  }
}

export async function notifyOwner(user, typeKeys) {
  await Promise.all([sendPush(user, typeKeys), sendTelegram(user, typeKeys)]);
}

export { TYPES, TEXTS, getMessage };
