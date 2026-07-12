import crypto from "node:crypto";

/** Strip control characters and cap length; never echoes raw HTML back unescaped. */
export function sanitiseText(input, maxLen = 1000) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLen)
    .trim();
}

/** Generates an anonymous, non-reversible session identifier. Never derived from IP or any PII. */
export function newSessionHash() {
  return "User#" + crypto.randomInt(1000, 9999) + "-" + crypto.randomBytes(4).toString("hex");
}

/** One-way hash for admin email storage (so even the admins table isn't a plaintext PII dump). */
export function hashEmail(email) {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/** Very small blocklist to catch attempts at doxxing / drug-sourcing requests inside chat text. */
const BLOCKED_PATTERNS = [
  /\b\d{9,}\b/, // long digit strings that look like phone/ID numbers
  /where can i (buy|get|score)/i,
  /sell(ing)? (me|to me)/i,
];
export function containsBlockedContent(text) {
  return BLOCKED_PATTERNS.some((re) => re.test(text));
}
