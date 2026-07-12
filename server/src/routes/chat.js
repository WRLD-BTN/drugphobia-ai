import express from "express";
import { classify, detectAgeFlag } from "../triage.js";
import { generateResponse } from "../aiClient.js";
import { db } from "../db.js";
import { sanitiseText, containsBlockedContent, newSessionHash } from "../utils/sanitize.js";
import { chatLimiter } from "../middleware/rateLimit.js";

const router = express.Router();
router.use(chatLimiter);

const FIXED_DISCLAIMER =
  "DrugPhobia AI provides information only. Not medical advice or therapy. " +
  "For emergencies call 999 or Police 999. NDA Helpline 0808 20 20 (verify locally).";

const CRISIS_CARD = {
  heading: "You are not alone. Help is 1 tap away.",
  actions: [
    { label: "Childline 116", type: "call", value: "116" },
    { label: "Childline WhatsApp", type: "whatsapp", value: "+263719116116" },
    { label: "NDA Helpline (verify)", type: "call", value: "0808 20 20" },
    { label: "Text HELP to 3939", type: "sms", value: "3939" },
  ],
  lockUntil: "I'm safe now",
};

/** POST /triage — stateless classification, used by the client to double-check its own local classifier. */
router.post("/triage", (req, res) => {
  const text = sanitiseText(req.body?.text || "");
  if (!text) return res.status(400).json({ error: "Empty message" });

  const result = classify(text);
  const ageFlag = detectAgeFlag(text);
  res.json({ tier: result.tier, drugCategory: result.drugCategory, ageFlag: !!ageFlag });
});

/**
 * POST /chat — the main conversational endpoint (HTTP fallback for clients
 * without a working WebSocket; the Socket.io gateway in index.js wraps the
 * same pipeline for real-time chat).
 *
 * IMPORTANT: raw message text is used in-memory for this one request and is
 * NEVER written to the database. Only the aggregate flags below are stored.
 */
router.post("/chat", async (req, res) => {
  const text = sanitiseText(req.body?.text || "");
  const lang = ["en", "sn", "nd"].includes(req.body?.lang) ? req.body.lang : "en";
  const sessionHash = req.body?.sessionHash || newSessionHash();

  if (!text) return res.status(400).json({ error: "Empty message" });

  if (containsBlockedContent(text)) {
    return res.json({
      sessionHash,
      tier: "GREEN",
      text: "I can't help with that request. If you're looking for support, the NDA helpline or Childline 116 are good places to start.",
      crisisCard: null,
    });
  }

  const gate = classify(text);
  const ageFlag = detectAgeFlag(text);

  logMetadata({
    sessionHash,
    crisisFlag: gate.tier === "RED",
    language: lang,
    drugCategory: gate.drugCategory,
    ageFlag,
    triggeredKeywords: gate.matchedKeywords,
  });

  // RED — deterministic path, no AI involved, chat is "broken" (crisis card only).
  if (gate.tier === "RED") {
    return res.json({
      sessionHash,
      tier: "RED",
      text: FIXED_DISCLAIMER,
      crisisCard: CRISIS_CARD,
      ageFlag: !!ageFlag,
    });
  }

  // YELLOW — deterministic path, show peer chat + helpline buttons, chat continues.
  if (gate.tier === "YELLOW") {
    return res.json({
      sessionHash,
      tier: "YELLOW",
      text:
        lang === "sn"
          ? "Zvinonzwisisika kunetseka nazvo. Unogona kutaura nemumwe munhu, kana kufonera 577 (toll-free) kana NDA."
          : lang === "nd"
          ? "Kuyaqondakala ukukhathazeka. Ungakhuluma lomunye umuntu, noma ufonele i-NDA."
          : "That sounds like a lot to carry. You can talk to a peer counsellor, or call the NDA helpline.",
      crisisCard: null,
      actions: [
        { label: "Anonymous Peer Chat", type: "peer_chat" },
        { label: "NDA Helpline (verify)", type: "call", value: "0808 20 20" },
      ],
      ageFlag: !!ageFlag,
    });
  }

  // GREEN / UNKNOWN — safe to consult the guarded AI layer for general Q&A.
  const aiResult = await generateResponse({ text, lang });
  return res.json({
    sessionHash,
    tier: "GREEN",
    text: aiResult.text,
    mode: aiResult.mode || "rule",
    crisisCard: null,
    ageFlag: !!ageFlag,
  });
});

/** POST /chat/referral-click — logs that a user tapped a helpline button, for the admin referral-rate metric. */
router.post("/chat/referral-click", (req, res) => {
  const sessionHash = req.body?.sessionHash;
  if (!sessionHash) return res.status(400).json({ error: "Missing sessionHash" });
  db.prepare(
    `UPDATE chats_metadata SET referral_clicked = 1 WHERE session_hash = ? AND id = (
       SELECT id FROM chats_metadata WHERE session_hash = ? ORDER BY id DESC LIMIT 1
     )`
  ).run(sessionHash, sessionHash);
  res.json({ ok: true });
});

function logMetadata({ sessionHash, crisisFlag, language, drugCategory, ageFlag, triggeredKeywords }) {
  db.prepare(
    `INSERT INTO chats_metadata
      (session_hash, crisis_flag, referral_clicked, language, drug_category_detected, age_flag, triggered_keywords)
     VALUES (?, ?, 0, ?, ?, ?, ?)`
  ).run(sessionHash, crisisFlag ? 1 : 0, language, drugCategory, ageFlag || null, JSON.stringify(triggeredKeywords || []));
}

export default router;
