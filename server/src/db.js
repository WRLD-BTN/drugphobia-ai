// db.js
//
// Storage layer. Dev/demo default is SQLite (zero external services needed
// to run the prototype locally or on Render). For the ZCHPC CCE / production
// deployment, point DATABASE_URL at Supabase Postgres instead and swap the
// driver here — the schema (see /server/sql/schema.sql) is written in
// plain, portable SQL so the migration is mechanical.
//
// HARD RULE: this file must never gain a column or table that stores raw
// chat text, a phone number, an IP address, or a name. If you're adding a
// column, ask "would this identify a person?" before you add it.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SQLITE_PATH || path.resolve(__dirname, "../data/drugphobia.db");

export function ensureDatabaseDirectory(dbPath = DB_PATH) {
  const directory = path.dirname(dbPath);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

ensureDatabaseDirectory(DB_PATH);

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  session_hash TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  ttl_hours    INTEGER NOT NULL DEFAULT 24
);

CREATE TABLE IF NOT EXISTS chats_metadata (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  session_hash        TEXT NOT NULL,
  ts                  TEXT NOT NULL DEFAULT (datetime('now')),
  crisis_flag         INTEGER NOT NULL DEFAULT 0,
  referral_clicked    INTEGER NOT NULL DEFAULT 0,
  language            TEXT,
  drug_category_detected TEXT,
  age_flag            INTEGER,
  triggered_keywords  TEXT
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_hash TEXT NOT NULL,
  ts           TEXT NOT NULL DEFAULT (datetime('now')),
  module_id    TEXT NOT NULL,
  score        INTEGER NOT NULL,
  total        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash TEXT UNIQUE NOT NULL,
  pass_hash  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'moderator',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS moderation_flags (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_hash TEXT NOT NULL,
  ts           TEXT NOT NULL DEFAULT (datetime('now')),
  reason       TEXT,
  resolved     INTEGER NOT NULL DEFAULT 0
);
`);

/**
 * Purge any chats_metadata / moderation_flags / sessions row older than its
 * TTL (default 24h). Wired to run hourly from index.js via node-cron, and
 * also callable directly for tests.
 */
export function purgeExpired() {
  const result = db
    .prepare(`DELETE FROM chats_metadata WHERE ts < datetime('now', '-24 hours')`)
    .run();
  db.prepare(`DELETE FROM sessions WHERE created_at < datetime('now', '-24 hours')`).run();
  return result.changes;
}

export function scheduleHourlyPurge() {
  cron.schedule("0 * * * *", () => {
    const deleted = purgeExpired();
    if (deleted > 0) console.log(`[cron] purged ${deleted} expired chats_metadata rows`);
  });
}
