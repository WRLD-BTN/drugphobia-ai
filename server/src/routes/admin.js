import express from "express";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { signAdminToken, requireAdmin, requireRole } from "../middleware/auth.js";
import { adminLoginLimiter } from "../middleware/rateLimit.js";
import { hashEmail } from "../utils/sanitize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLINICS_PATH = path.resolve(__dirname, "../../../shared/clinics.json");
const RESEARCH_PATH = path.resolve(__dirname, "../../../shared/research_db.json");

const router = express.Router();

/* ---------------------------------------------------------------------- */
/* Auth                                                                    */
/* ---------------------------------------------------------------------- */

router.post("/admin/login", adminLoginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const emailHash = hashEmail(email);
  const admin = db.prepare("SELECT * FROM admins WHERE email_hash = ?").get(emailHash);
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = bcrypt.compareSync(password, admin.pass_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAdminToken(admin);
  res.json({ token, role: admin.role, expiresInMinutes: 15 });
});

router.use("/admin", requireAdmin); // everything below this line requires a valid admin session

/* ---------------------------------------------------------------------- */
/* Dashboards — aggregates ONLY, never raw chat text                       */
/* ---------------------------------------------------------------------- */

router.get("/admin/dashboard/summary", (req, res) => {
  const chatsToday = db
    .prepare(`SELECT COUNT(*) n FROM chats_metadata WHERE ts >= datetime('now', '-1 day')`)
    .get().n;
  const chatsWeek = db
    .prepare(`SELECT COUNT(*) n FROM chats_metadata WHERE ts >= datetime('now', '-7 day')`)
    .get().n;
  const chatsMonth = db
    .prepare(`SELECT COUNT(*) n FROM chats_metadata WHERE ts >= datetime('now', '-30 day')`)
    .get().n;
  const crisisTotal = db.prepare(`SELECT COUNT(*) n FROM chats_metadata WHERE crisis_flag = 1`).get().n;
  const allTotal = db.prepare(`SELECT COUNT(*) n FROM chats_metadata`).get().n;
  const referralClicks = db.prepare(`SELECT COUNT(*) n FROM chats_metadata WHERE referral_clicked = 1`).get().n;

  const topDrugs = db
    .prepare(
      `SELECT drug_category_detected as drug, COUNT(*) n FROM chats_metadata
       WHERE drug_category_detected IS NOT NULL
       GROUP BY drug_category_detected ORDER BY n DESC LIMIT 5`
    )
    .all();

  const langSplit = db
    .prepare(`SELECT language, COUNT(*) n FROM chats_metadata WHERE language IS NOT NULL GROUP BY language`)
    .all();

  const quizStats = db
    .prepare(`SELECT module_id, COUNT(*) attempts, AVG(1.0 * score / total) avg_pct FROM quiz_results GROUP BY module_id`)
    .all();

  res.json({
    chatsToday,
    chatsWeek,
    chatsMonth,
    crisisTotal,
    crisisPct: allTotal ? +(100 * crisisTotal / allTotal).toFixed(1) : 0,
    referralClicks,
    referralRatePct: allTotal ? +(100 * referralClicks / allTotal).toFixed(1) : 0,
    topDrugs,
    langSplit,
    quizStats,
  });
});

/** GET /admin/dashboard/timeseries — last 14 days of {day, total, crisis}, used by the trend line chart. */
router.get("/admin/dashboard/timeseries", (req, res) => {
  const rows = db
    .prepare(
      `SELECT date(ts) as day,
              COUNT(*) as total,
              SUM(CASE WHEN crisis_flag = 1 THEN 1 ELSE 0 END) as crisis
       FROM chats_metadata
       WHERE ts >= datetime('now', '-14 days')
       GROUP BY date(ts)
       ORDER BY day ASC`
    )
    .all();

  // Fill in any missing days in the 14-day window with zeroes so the chart
  // doesn't show misleading gaps as if no data collection happened.
  const byDay = Object.fromEntries(rows.map((r) => [r.day, r]));
  const filled = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    filled.push({ day: d, total: byDay[d]?.total || 0, crisis: byDay[d]?.crisis || 0 });
  }
  res.json(filled);
});

/** GET /admin/dashboard/timeseries — daily chat + crisis counts for the last 14 days, for the trend line chart. */
router.get("/admin/dashboard/timeseries", (req, res) => {
  const rows = db
    .prepare(
      `SELECT date(ts) as day,
              COUNT(*) as total,
              SUM(CASE WHEN crisis_flag = 1 THEN 1 ELSE 0 END) as crisis
       FROM chats_metadata
       WHERE ts >= datetime('now', '-14 days')
       GROUP BY date(ts)
       ORDER BY day ASC`
    )
    .all();
  res.json(rows);
});

/** GET /admin/export.csv — timestamp, session_id, crisis_triggered, referral_clicked, language, drug_detected, quiz_score */
router.get("/admin/export.csv", (req, res) => {
  const rows = db
    .prepare(
      `SELECT ts, session_hash, crisis_flag, referral_clicked, language, drug_category_detected
       FROM chats_metadata ORDER BY ts DESC LIMIT 5000`
    )
    .all();
  const header = "timestamp,session_id,crisis_triggered_yes_no,referral_clicked_yes_no,language,drug_detected\n";
  const body = rows
    .map((r) =>
      [r.ts, r.session_hash, r.crisis_flag ? "yes" : "no", r.referral_clicked ? "yes" : "no", r.language || "", r.drug_category_detected || ""].join(",")
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=drugphobia_export.csv");
  res.send(header + body);
});

/* ---------------------------------------------------------------------- */
/* Moderation                                                              */
/* ---------------------------------------------------------------------- */

router.get("/admin/moderation/flags", (req, res) => {
  const flags = db.prepare(`SELECT * FROM moderation_flags WHERE resolved = 0 ORDER BY ts DESC`).all();
  res.json(flags);
});

router.post("/admin/moderation/flags/:id/resolve", requireRole("moderator", "admin"), (req, res) => {
  db.prepare(`UPDATE moderation_flags SET resolved = 1 WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

/* ---------------------------------------------------------------------- */
/* Resource Manager — CRUD for clinics.json without a redeploy             */
/* ---------------------------------------------------------------------- */

router.get("/admin/resources", (req, res) => {
  res.json(JSON.parse(fs.readFileSync(CLINICS_PATH, "utf-8")));
});

router.put("/admin/resources", requireRole("admin"), (req, res) => {
  const incoming = req.body;
  if (!incoming?.helplines || !incoming?.facilities) {
    return res.status(400).json({ error: "Payload must include helplines[] and facilities[]" });
  }
  fs.writeFileSync(CLINICS_PATH, JSON.stringify(incoming, null, 2));
  res.json({ ok: true });
});

/* ---------------------------------------------------------------------- */
/* CMS — Did You Know cards (draft/publish kept simple: direct write)      */
/* ---------------------------------------------------------------------- */

router.get("/admin/research-db", (req, res) => {
  res.json(JSON.parse(fs.readFileSync(RESEARCH_PATH, "utf-8")));
});

router.put("/admin/research-db", requireRole("admin"), (req, res) => {
  if (!req.body?.cards) return res.status(400).json({ error: "Payload must include cards[]" });
  fs.writeFileSync(RESEARCH_PATH, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

export default router;
