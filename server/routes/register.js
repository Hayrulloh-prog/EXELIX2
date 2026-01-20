import { Router } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../db.js';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `photo_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post('/register', upload.single('photo'), (req, res) => {
  const { qrCode, name, surname, phone, telegram, profileOpen, lang } = req.body;
  if (!qrCode || !name || !surname || !phone) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name, surname, phone are required' });
  }
  const qr = db.prepare('SELECT * FROM qr_codes WHERE code = ?').get(String(qrCode).trim());
  if (!qr) return res.status(404).json({ error: 'QR_NOT_FOUND' });
  if (qr.status !== 'inactive') return res.status(400).json({ error: 'QR_ALREADY_ACTIVE' });

  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const profileOpenVal = String(profileOpen) === '1' || String(profileOpen) === 'true' ? 1 : 0;
  const langVal = ['ru', 'ky', 'en'].includes(String(lang)) ? lang : 'ru';

  const insertUser = db.prepare(`
    INSERT INTO users (qr_code_id, name, surname, photo, phone, telegram, profile_open, lang)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const r = insertUser.run(qr.id, String(name).trim(), String(surname).trim(), photo, String(phone).trim(), telegram ? String(telegram).trim() : null, profileOpenVal, langVal);
  const userId = r.lastInsertRowid;

  db.prepare("UPDATE qr_codes SET status = 'active', user_id = ? WHERE id = ?").run(userId, qr.id);

  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiry });
  res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ success: true, token, user: { id: userId, name, surname, photo, phone, telegram: telegram || null, profile_open: !!profileOpenVal } });
});

export default router;
