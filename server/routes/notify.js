import { Router } from 'express';
import db from '../db.js';
import config from '../config.js';
import { notifyOwner, TYPES } from '../services/notify.js';

const router = Router();

const CRITICAL_KEYS = ['evacuate', 'serious_accident'];

function checkSenderLimits(ip, fingerprint, types) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT types, is_critical FROM notifications
    WHERE sender_ip = ? AND (fingerprint = ? OR fingerprint IS NULL AND ? IS NULL)
    AND date(created_at) = ?
  `).all(ip, fingerprint || null, fingerprint || null, today);

  let regular = 0, critical = 0;
  for (const r of rows) {
    const t = (r.types || '').split(',').filter(Boolean);
    for (const k of t) {
      if (CRITICAL_KEYS.includes(k)) critical++;
      else regular++;
    }
  }
  for (const k of types) {
    if (CRITICAL_KEYS.includes(k)) critical++;
    else regular++;
  }
  if (regular > config.senderLimitRegular) return { ok: false, reason: 'LIMIT_REGULAR' };
  if (critical > config.senderLimitCritical) return { ok: false, reason: 'LIMIT_CRITICAL' };
  return { ok: true };
}

function checkOwnerLimit(qrCodeId) {
  const today = new Date().toISOString().slice(0, 10);
  const count = db.prepare(`
    SELECT COUNT(*) as c FROM notifications WHERE qr_code_id = ? AND date(created_at) = ?
  `).get(qrCodeId, today);
  return (count?.c || 0) >= config.ownerLimitPerDay;
}

function logAttempt(ip, outcome) {
  try {
    db.prepare('INSERT INTO send_attempts (ip, outcome) VALUES (?, ?)').run(ip, outcome);
  } catch (e) {}
}

function checkThrottle(ip, fingerprint) {
  const key = `s:${ip}:${fingerprint || 'x'}`;
  const row = db.prepare('SELECT at FROM send_throttle WHERE key = ?').get(key);
  if (!row) return true;
  const elapsed = (Date.now() - new Date(row.at).getTime()) / 1000;
  return elapsed >= config.sendDelaySeconds;
}

function setThrottle(ip, fingerprint) {
  const key = `s:${ip}:${fingerprint || 'x'}`;
  db.prepare('INSERT OR REPLACE INTO send_throttle (key, at) VALUES (?, datetime(\'now\'))').run(key);
}

router.post('/send', async (req, res) => {
  const { qrCode, types: typesRaw, hcaptchaToken } = req.body;
  const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
  const fingerprint = req.body.fingerprint || null;

  if (!qrCode || !Array.isArray(typesRaw) || typesRaw.length === 0) {
    logAttempt(ip, 'fail');
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'qrCode and types[] required' });
  }

  const typeKeys = typesRaw.filter((k) => TYPES[k]);
  if (typeKeys.length === 0) {
    logAttempt(ip, 'fail');
    return res.status(400).json({ error: 'INVALID_TYPES' });
  }

  if (!checkThrottle(ip, fingerprint)) {
    logAttempt(ip, 'fail');
    return res.status(429).json({ error: 'TOO_FAST', message: 'SEND_DELAY' });
  }

  if (config.hcaptchaSecret && config.hcaptchaSiteKey) {
    if (!hcaptchaToken) {
      logAttempt(ip, 'fail');
      return res.status(400).json({ error: 'CAPTCHA_REQUIRED' });
    }
    try {
      const r = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: config.hcaptchaSecret, response: hcaptchaToken }),
      });
      const j = await r.json();
      if (!j.success) {
        logAttempt(ip, 'fail');
        return res.status(400).json({ error: 'CAPTCHA_FAILED' });
      }
    } catch (e) {
      logAttempt(ip, 'fail');
      return res.status(500).json({ error: 'CAPTCHA_ERROR' });
    }
  }

  const lim = checkSenderLimits(ip, fingerprint, typeKeys);
  if (!lim.ok) {
    logAttempt(ip, 'fail');
    return res.status(429).json({ error: 'SENDER_LIMIT', code: lim.reason, message: 'LIMIT_REACHED' });
  }

  const qr = db.prepare('SELECT * FROM qr_codes WHERE code = ?').get(String(qrCode).trim());
  if (!qr || qr.status !== 'active') {
    logAttempt(ip, 'fail');
    return res.status(404).json({ error: 'QR_NOT_FOUND' });
  }

  const user = db.prepare('SELECT * FROM users WHERE qr_code_id = ?').get(qr.id);
  if (!user) {
    logAttempt(ip, 'fail');
    return res.status(500).json({ error: 'NO_OWNER' });
  }

  if (checkOwnerLimit(qr.id)) {
    logAttempt(ip, 'fail');
    return res.status(429).json({ error: 'OWNER_LIMIT', message: 'OWNER_LIMIT_REACHED' });
  }

  const isCritical = typeKeys.some((k) => CRITICAL_KEYS.includes(k)) ? 1 : 0;
  db.prepare(`
    INSERT INTO notifications (qr_code_id, sender_ip, fingerprint, types, is_critical)
    VALUES (?, ?, ?, ?, ?)
  `).run(qr.id, ip, fingerprint, typeKeys.join(','), isCritical);

  logAttempt(ip, 'success');
  setThrottle(ip, fingerprint);
  await notifyOwner(user, typeKeys);

  res.json({ success: true, message: 'SENT' });
});

export default router;
