import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";

import chatRoutes from "./routes/chat.js";
import resourceRoutes from "./routes/resources.js";
import quizRoutes from "./routes/quiz.js";
import adminRoutes from "./routes/admin.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { classify, detectAgeFlag } from "./triage.js";
import { generateResponse } from "./aiClient.js";
import { sanitiseText, containsBlockedContent, newSessionHash } from "./utils/sanitize.js";
import { db, scheduleHourlyPurge } from "./db.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN?.split(",") || "*" },
});

const PORT = process.env.PORT || 4000;

/* --------------------------- Security headers --------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    hsts: { maxAge: 15552000, includeSubDomains: true },
  })
);
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json({ limit: "50kb" }));
app.use(generalLimiter);

/* -------------------------------- Routes --------------------------------- */
app.get("/health", (req, res) => res.json({ ok: true, service: "drugphobia-ai-server" }));
app.use("/api", chatRoutes);
app.use("/api", resourceRoutes);
app.use("/api", quizRoutes);
app.use("/api", adminRoutes);

/* ------------------------------ Socket.io -------------------------------- */
// Real-time chat gateway. Mirrors the exact same triage → AI pipeline as
// POST /api/chat, just over a WSS connection for lower-latency chat UX.
// Chat content is held in memory for the duration of handling one message
// and is never written to disk.
io.on("connection", (socket) => {
  const sessionHash = socket.handshake.auth?.sessionHash || newSessionHash();
  socket.emit("session", { sessionHash });

  // Short-term, in-memory only conversation history for this ONE socket
  // connection — never written to disk, never sent anywhere else. Lets the
  // guarded AI layer respond like it's actually following the conversation
  // instead of treating every message as a cold start. Capped so a long
  // chat can't grow the prompt (and therefore API cost/latency) unbounded.
  const history = [];
  const MAX_HISTORY_TURNS = 6;

  socket.on("message", async (payload) => {
    try {
      const text = sanitiseText(payload?.text || "");
      const lang = ["en", "sn", "nd"].includes(payload?.lang) ? payload.lang : "en";
      if (!text) return;

      if (containsBlockedContent(text)) {
        socket.emit("reply", {
          tier: "GREEN",
          text: "I can't help with that request. The NDA helpline or Childline 116 are good places to start.",
        });
        return;
      }

      const gate = classify(text);
      const ageFlag = detectAgeFlag(text);

      db.prepare(
        `INSERT INTO chats_metadata (session_hash, crisis_flag, language, drug_category_detected, age_flag, triggered_keywords)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(sessionHash, gate.tier === "RED" ? 1 : 0, lang, gate.drugCategory, ageFlag || null, JSON.stringify(gate.matchedKeywords));

      if (gate.tier === "RED") {
        socket.emit("crisis", {
          heading: "You are not alone. Help is 1 tap away.",
          actions: [
            { label: "Childline 116", type: "call", value: "116" },
            { label: "Childline WhatsApp", type: "whatsapp", value: "+263719116116" },
            { label: "NDA Helpline (verify)", type: "call", value: "0808 20 20" },
            { label: "Text HELP to 3939", type: "sms", value: "3939" },
          ],
          lockUntil: "I'm safe now",
        });
        history.length = 0; // don't carry crisis context forward once resolved
        return; // chat is broken — no further AI response for a RED message
      }

      if (gate.tier === "YELLOW") {
        socket.emit("reply", {
          tier: "YELLOW",
          text: "That sounds like a lot to carry. You're not the only one going through this.",
          actions: [
            { label: "Anonymous Peer Chat", type: "peer_chat" },
            { label: "NDA Helpline (verify)", type: "call", value: "0808 20 20" },
          ],
          ageFlag: !!ageFlag,
        });
        return;
      }

      // Let the client show a "typing" indicator while the AI layer (or
      // offline fallback) puts a reply together — matters most when a real
      // LLM call is in flight, since that round-trip isn't instant.
      socket.emit("typing", { typing: true });

      const aiResult = await generateResponse({ text, lang, history });
      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: aiResult.text });
      while (history.length > MAX_HISTORY_TURNS * 2) history.shift();

      socket.emit("typing", { typing: false });
      socket.emit("reply", { tier: "GREEN", text: aiResult.text, mode: aiResult.mode, ageFlag: !!ageFlag });
    } catch (err) {
      console.error("[socket] error handling message:", err);
      socket.emit("typing", { typing: false });
      socket.emit("reply", { tier: "GREEN", text: "Something went wrong on my end — please try again." });
    }
  });

  // Session auto-delete note: the row this session writes to chats_metadata
  // is purged by the hourly cron in db.js after 24h regardless of whether
  // the socket is still connected.
});

scheduleHourlyPurge();

server.listen(PORT, () => {
  console.log(`DrugPhobia AI server listening on port ${PORT}`);
  console.log(`LLM mode: ${process.env.LLM_API_KEY ? "live API" : "offline fallback (no LLM_API_KEY set)"}`);
});
