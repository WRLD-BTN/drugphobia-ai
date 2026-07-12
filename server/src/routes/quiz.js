import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUIZ_PATH = path.resolve(__dirname, "../../../shared/quiz_bank.json");

function loadQuizBank() {
  return JSON.parse(fs.readFileSync(QUIZ_PATH, "utf-8"));
}

const router = express.Router();

/** GET /quiz — module list + questions (answers included; this is a low-stakes educational quiz, not an exam). */
router.get("/quiz", (req, res) => {
  res.json(loadQuizBank());
});

/**
 * POST /quiz/submit — client scores itself and reports only the final
 * score. We never receive or store per-question answers.
 */
router.post("/quiz/submit", (req, res) => {
  const { sessionHash, moduleId, score, total } = req.body || {};
  if (!sessionHash || !moduleId || typeof score !== "number" || typeof total !== "number") {
    return res.status(400).json({ error: "sessionHash, moduleId, score and total are required" });
  }
  db.prepare(
    `INSERT INTO quiz_results (session_hash, module_id, score, total) VALUES (?, ?, ?, ?)`
  ).run(sessionHash, moduleId, score, total);
  res.json({ ok: true });
});

export default router;
