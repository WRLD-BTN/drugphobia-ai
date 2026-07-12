-- schema.sql
--
-- Portable reference schema for the ZCHPC CCE / production deployment on
-- Supabase Postgres. server/src/db.js creates the equivalent schema
-- automatically in SQLite for local dev — this file is the Postgres-flavour
-- version to run once against a fresh Supabase project.
--
-- HARD RULE: no column here may store raw chat text, a phone number, an IP
-- address, or a name. chats_metadata is aggregate-only by design.

CREATE TABLE IF NOT EXISTS sessions (
  session_hash TEXT PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ttl_hours    INTEGER NOT NULL DEFAULT 24
);

CREATE TABLE IF NOT EXISTS chats_metadata (
  id                      BIGSERIAL PRIMARY KEY,
  session_hash            TEXT NOT NULL,
  ts                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  crisis_flag             BOOLEAN NOT NULL DEFAULT false,
  referral_clicked        BOOLEAN NOT NULL DEFAULT false,
  language                TEXT,
  drug_category_detected  TEXT,
  age_flag                INTEGER,
  triggered_keywords      JSONB
);

CREATE INDEX IF NOT EXISTS idx_chats_metadata_ts ON chats_metadata (ts);
CREATE INDEX IF NOT EXISTS idx_chats_metadata_session ON chats_metadata (session_hash);

CREATE TABLE IF NOT EXISTS quiz_results (
  id           BIGSERIAL PRIMARY KEY,
  session_hash TEXT NOT NULL,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  module_id    TEXT NOT NULL,
  score        INTEGER NOT NULL,
  total        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id         BIGSERIAL PRIMARY KEY,
  email_hash TEXT UNIQUE NOT NULL,
  pass_hash  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'moderator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_flags (
  id           BIGSERIAL PRIMARY KEY,
  session_hash TEXT NOT NULL,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason       TEXT,
  resolved     BOOLEAN NOT NULL DEFAULT false
);

-- Row-Level Security: enable and lock down before exposing the Supabase
-- anon/public API key to any client. The Node/Express server should use the
-- service role key server-side only; the browser must never talk to
-- Supabase directly.
ALTER TABLE chats_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
-- No policies are created here on purpose: with RLS enabled and zero
-- policies, only the service role (used by the backend) can read/write.

-- Scheduled purge: mirrors the hourly cron in server/src/db.js. If running
-- natively on Postgres, either keep the purge in the Node process (simplest,
-- already implemented) or additionally schedule this via pg_cron:
-- SELECT cron.schedule('purge_expired_chats', '0 * * * *',
--   $$DELETE FROM chats_metadata WHERE ts < now() - interval '24 hours'$$);
