import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireOwner } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `photo_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.jpg'}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(requireOwner);

router.get('/me', (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    name: u.name,
    surname: u.surname,
    photo: u.photo,
    phone: u.phone,
    telegram: u.telegram,
    profile_open: !!u.profile_open,
    at_car: !!u.at_car,
    lang: u.lang || 'ru',
  });
});

router.put('/me', upload.single('photo'), (req, res) => {
  const { name, surname, phone, telegram, lang } = req.body;
  const u = req.user;
  const n = name != null ? String(name).trim() : u.name;
  const s = surname != null ? String(surname).trim() : u.surname;
  const p = phone != null ? String(phone).trim() : u.phone;
  const t = telegram !== undefined && telegram !== '' ? String(telegram).trim() : (u.telegram || null);
  const l = ['ru', 'ky', 'en'].includes(String(lang)) ? lang : (u.lang || 'ru');
  const photo = req.file ? `/uploads/${req.file.filename}` : u.photo;
  db.prepare(`
    UPDATE users SET name=?, surname=?, phone=?, telegram=?, photo=?, lang=?, updated_at=datetime('now')
    WHERE id=?
  `).run(n, s, p, t, photo, l, u.id);
  res.json({ success: true, user: { id: u.id, name: n, surname: s, photo, phone: p, telegram: t, profile_open: !!u.profile_open, at_car: !!req.user.at_car, lang: l } });
});

router.post('/telegram', (req, res) => {
  const { telegram } = req.body;
  const u = req.user;
  const t = telegram != null ? String(telegram).trim() : null;
  db.prepare('UPDATE users SET telegram=?, updated_at=datetime(\'now\') WHERE id=?').run(t, u.id);
  res.json({ success: true, telegram: t });
});

router.post('/at-car', (req, res) => {
  const u = req.user;
  db.prepare("UPDATE users SET at_car=1, updated_at=datetime('now') WHERE id=?").run(u.id);
  res.json({ success: true, at_car: true });
});

router.post('/at-car-off', (req, res) => {
  const u = req.user;
  db.prepare("UPDATE users SET at_car=0, updated_at=datetime('now') WHERE id=?").run(u.id);
  res.json({ success: true, at_car: false });
});

router.post('/push-subscription', (req, res) => {
  const { subscription } = req.body;
  const u = req.user;
  const raw = subscription && typeof subscription === 'object' ? JSON.stringify(subscription) : null;
  db.prepare('UPDATE users SET push_subscription=? WHERE id=?').run(raw, u.id);
  res.json({ success: true });
});

export default router;
