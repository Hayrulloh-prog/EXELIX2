import { Router } from 'express';
import db from '../db.js';
import { optionalOwner } from '../middleware/auth.js';

const router = Router();

router.get('/q/:code', optionalOwner, (req, res) => {
  const { code } = req.params;
  const qr = db.prepare('SELECT * FROM qr_codes WHERE code = ?').get(code);
  if (!qr) {
    return res.status(404).json({ error: 'QR_NOT_FOUND' });
  }
  if (qr.status === 'inactive') {
    return res.json({ action: 'register', qrCode: code });
  }
  const user = db.prepare('SELECT id, name, surname, photo, phone, telegram, profile_open, lang, at_car FROM users WHERE qr_code_id = ?').get(qr.id);
  if (!user) return res.status(500).json({ error: 'NO_OWNER' });

  const isOwner = req.user && req.user.id === user.id;
  if (isOwner) {
    return res.json({ action: 'cabinet', user: { id: user.id, name: user.name, surname: user.surname, photo: user.photo, phone: user.phone, telegram: user.telegram, profile_open: user.profile_open, at_car: !!user.at_car } });
  }

  const publicInfo = user.profile_open
    ? { name: user.name, surname: user.surname, photo: user.photo, phone: user.phone }
    : { name: null, surname: null, photo: null, phone: user.phone };
  res.json({
    action: 'notify',
    qrCode: code,
    owner: publicInfo,
    canCall: true,
    canTelegram: !!user.telegram,
    telegram: user.telegram,
    phone: user.phone,
  });
});

export default router;
