import jwt from 'jsonwebtoken';
import config from '../config.js';

const ADMIN_JWT_SECRET = (config.jwtSecret || '') + '-admin';

export function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function signAdminToken() {
  return jwt.sign({ role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '7d' });
}
