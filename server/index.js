import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import config from './config.js';
import db from './db.js';
import { initPush } from './services/notify.js';
import qrRouter from './routes/qr.js';
import registerRouter from './routes/register.js';
import notifyRouter from './routes/notify.js';
import ownerRouter from './routes/owner.js';
import adminRouter from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/qr', qrRouter);
app.use('/api', registerRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/admin', adminRouter);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

initPush();

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`EXELIX server on http://localhost:${PORT}`);
});
