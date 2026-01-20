const API = import.meta.env.VITE_API_URL || '';
const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Для Netlify функций (если они нужны)
const NETLIFY_API_URL = import.meta.env.PROD
  ? '/.netlify/functions/my_functions'
  : 'http://localhost:8888/.netlify/functions/my_functions';

// Экспортируем переменные для использования в компонентах
export { API, HCAPTCHA_SITEKEY, VAPID_PUBLIC_KEY };

// Функции для Netlify (опционально)
export const testFunction = async () => {
  const response = await fetch(NETLIFY_API_URL);
  return response.json();
};

export const sendData = async (data) => {
  const response = await fetch(NETLIFY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Остальной ваш код остается БЕЗ изменений:
function getAuth() {
  return { credentials: 'include' };
}

export async function fetchQrInfo(code) {
  const r = await fetch(`${API}/api/qr/q/${code}`, getAuth());
  if (!r.ok) throw new Error(r.status === 404 ? 'QR_NOT_FOUND' : 'ERROR');
  return r.json();
}

export async function register(data) {
  const fd = new FormData();
  fd.append('qrCode', data.qrCode);
  fd.append('name', data.name);
  fd.append('surname', data.surname);
  fd.append('phone', data.phone);
  fd.append('profileOpen', data.profileOpen ? '1' : '0');
  fd.append('lang', data.lang || 'ru');
  if (data.telegram) fd.append('telegram', data.telegram);
  if (data.photo && data.photo instanceof File) fd.append('photo', data.photo);
  const r = await fetch(`${API}/api/register`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'ERROR');
  return j;
}

export async function sendNotify(qrCode, types, hcaptchaToken, fingerprint) {
  const r = await fetch(`${API}/api/notify/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ qrCode, types, hcaptchaToken, fingerprint }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || j.message || 'ERROR');
  return j;
}

export async function ownerMe() {
  const r = await fetch(`${API}/api/owner/me`, getAuth());
  if (!r.ok) throw new Error('AUTH');
  return r.json();
}

export async function ownerUpdate(data) {
  const fd = new FormData();
  if (data.name != null) fd.append('name', data.name);
  if (data.surname != null) fd.append('surname', data.surname);
  if (data.phone != null) fd.append('phone', data.phone);
  if (data.telegram !== undefined) fd.append('telegram', data.telegram);
  if (data.lang) fd.append('lang', data.lang);
  if (data.photo && data.photo instanceof File) fd.append('photo', data.photo);
  const r = await fetch(`${API}/api/owner/me`, {
    method: 'PUT',
    body: fd,
    credentials: 'include',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'ERROR');
  return j;
}

export async function ownerAddTelegram(telegram) {
  const r = await fetch(`${API}/api/owner/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ telegram }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'ERROR');
  return j;
}

export async function ownerAtCar(on) {
  const r = await fetch(`${API}/api/owner/at-car${on ? '' : '-off'}`, {
    method: 'POST',
    credentials: 'include',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'ERROR');
  return j;
}

export async function ownerPushSub(subscription) {
  const r = await fetch(`${API}/api/owner/push-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ subscription }),
  });
  if (!r.ok) throw new Error('ERROR');
  return r.json();
}

export async function adminLogin(login, password) {
  const r = await fetch(`${API}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ login, password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'ERROR');
  return j;
}

export async function adminStats() {
  const r = await fetch(`${API}/api/admin/stats`, { credentials: 'include' });
  if (!r.ok) throw new Error('AUTH');
  return r.json();
}

export async function adminUsers(offset = 0, limit = 40) {
  const r = await fetch(`${API}/api/admin/users?offset=${offset}&limit=${limit}`, { credentials: 'include' });
  if (!r.ok) throw new Error('AUTH');
  return r.json();
}

export async function adminDownloadQr() {
  const r = await fetch(`${API}/api/admin/qr-download`, { credentials: 'include' });
  if (!r.ok) throw new Error('ERROR');
  const blob = await r.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'exelix-qr-codes.zip';
  a.click();
  URL.revokeObjectURL(a.href);
}