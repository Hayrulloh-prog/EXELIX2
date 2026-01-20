import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultPath = process.env.DATABASE_PATH || join(__dirname, '..', 'data', 'exelix.db');

const dbDir = dirname(defaultPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(defaultPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    user_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    photo TEXT,
    phone TEXT NOT NULL,
    telegram TEXT,
    profile_open INTEGER NOT NULL DEFAULT 1,
    push_subscription TEXT,
    at_car INTEGER NOT NULL DEFAULT 0,
    lang TEXT NOT NULL DEFAULT 'ru',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code_id INTEGER NOT NULL,
    sender_ip TEXT NOT NULL,
    fingerprint TEXT,
    types TEXT NOT NULL,
    is_critical INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
  );

  CREATE TABLE IF NOT EXISTS request_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    path TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS send_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    outcome TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS send_throttle (
    key TEXT PRIMARY KEY,
    at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_qr_code ON qr_codes(code);
  CREATE INDEX IF NOT EXISTS idx_qr_user ON qr_codes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notif_qr ON notifications(qr_code_id);
  CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at);
  CREATE INDEX IF NOT EXISTS idx_notif_sender ON notifications(sender_ip, fingerprint, created_at);
`);

// Seed QR "demo" для разработки и первой проверки
try {
  db.prepare("INSERT OR IGNORE INTO qr_codes (code, status) VALUES ('demo', 'inactive')").run();
} catch (_) {}

export default db;
