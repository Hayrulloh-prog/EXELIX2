import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import db from '../db.js';
import config from '../config.js';
import { requireAdmin, signAdminToken } from '../middleware/adminAuth.js';

const ADMIN_JWT_SECRET = (config.jwtSecret || '') + '-admin';
const router = Router();

function initAdmin() {
  const exists = db.prepare('SELECT 1 FROM admins LIMIT 1').get();
  if (!exists) {
    const hash = bcrypt.hashSync(config.adminPassword, 10);
    db.prepare('INSERT INTO admins (login, password_hash) VALUES (?, ?)').run(config.adminLogin, hash);
  }
}
initAdmin();

router.post('/login', (req, res) => {
  const { login, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE login = ?').get(login);
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }
  const token = signAdminToken();
  res.cookie('adminToken', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ success: true, token });
});

router.use(requireAdmin);

router.get('/stats', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c ?? 0;
  const inactiveQr = db.prepare("SELECT COUNT(*) as c FROM qr_codes WHERE status = 'inactive'").get()?.c ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const total = db.prepare('SELECT COUNT(*) as c FROM notifications').get()?.c ?? 0;
  const successCount = db.prepare("SELECT COUNT(*) as c FROM send_attempts WHERE outcome = 'success' AND date(created_at) = ?").get(today)?.c ?? 0;
  const failedCount = db.prepare("SELECT COUNT(*) as c FROM send_attempts WHERE outcome = 'fail' AND date(created_at) = ?").get(today)?.c ?? 0;
  res.json({
    users,
    successful_requests: successCount,
    unsuccessful_requests: failedCount,
    total_requests: total,
    inactive_qr_count: inactiveQr,
  });
});

router.get('/users', (req, res) => {
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '40', 10)));
  const rows = db.prepare(`
    SELECT u.id, u.name, u.surname, u.photo, u.phone, u.telegram, u.created_at
    FROM users u
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  res.json({ users: rows });
});

router.get('/qr-download', async (req, res) => {
  const base = (config.siteUrl || config.apiUrl || '').replace(/\/$/, '') || `${req.protocol}://${req.get('host') || 'localhost'}`;
  const baseUrl = `${base}/q`;
  const codes = [];
  for (let i = 0; i < 100; i++) {
    const code = `ex${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 8)}`;
    const exists = db.prepare('SELECT 1 FROM qr_codes WHERE code = ?').get(code);
    if (exists) { i--; continue; }
    codes.push(code);
  }
  const insert = db.prepare('INSERT INTO qr_codes (code, status) VALUES (?, ?)');
  for (const c of codes) insert.run(c, 'inactive');

  const archive = archiver('zip', { zlib: { level: 9 } });
  res.attachment('exelix-qr-codes.zip');
  res.setHeader('Content-Type', 'application/zip');
  archive.pipe(res);

  for (let i = 0; i < codes.length; i++) {
    const url = `${baseUrl}/${codes[i]}`;
    const svg = await QRCode.toString(url, { type: 'svg', width: 400, margin: 2 });
    archive.append(svg, { name: `qr_${i + 1}.svg` });
  }
  await archive.finalize();
});

export default router;
