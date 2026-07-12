import rateLimit from "express-rate-limit";

// Generous enough for a real anonymous conversation, tight enough to blunt
// scripted abuse. Keyed on IP by default (express-rate-limit's default),
// but note: we never persist the IP anywhere ourselves — this middleware's
// in-memory counter is the only place it briefly exists, and it's never
// written to chats_metadata or any other table.
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages — please slow down for a moment." },
});

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
