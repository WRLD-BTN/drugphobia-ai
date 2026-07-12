// triageClient.js
//
// Offline-first mirror of server/src/triage.js. Runs entirely in the
// browser so triage works with zero connectivity (see Section 2.6 of the
// AI4I proposal — offline budget). The server re-runs the SAME lexicon on
// every message as the authoritative check (routes/chat.js / index.js
// socket handler) — this client copy is a fast first pass for UX, never
// the only gate. Keep this logic identical to the server version; if you
// change one, change both and re-run server/tests/triage.test.js.

import lexicon from "../../../shared/lexicon.json";

function normalise(text) {
  return text.toLowerCase().normalize("NFKC").trim();
}

function wordsInOrder(text, phrase) {
  const words = phrase.toLowerCase().split(/\s+/).filter(Boolean);
  let cursor = 0;
  for (const word of words) {
    const idx = text.indexOf(word, cursor);
    if (idx === -1) return false;
    cursor = idx + word.length;
  }
  return true;
}

function allLangPhrases(bucket) {
  return Object.entries(bucket)
    .filter(([lang]) => lang !== "_comment")
    .flatMap(([, phrases]) => phrases);
}

function detectDrug(text) {
  for (const [slang, category] of Object.entries(lexicon.slang_map)) {
    if (text.includes(slang.toLowerCase())) return category;
  }
  return null;
}

/** Same shape and same tiering rules as the server's classify(). */
export function classifyLocal(rawText) {
  const text = normalise(rawText);

  const redHit = allLangPhrases(lexicon.red).filter((p) => text.includes(p.toLowerCase()));
  if (redHit.length > 0) {
    return { tier: "RED", matchedKeywords: redHit, drugCategory: detectDrug(text), refusalTrigger: false };
  }

  const refusalHit = allLangPhrases(lexicon.dosage_or_sourcing_refusal_triggers).some((p) =>
    wordsInOrder(text, p)
  );
  if (refusalHit) {
    return { tier: "GREEN", matchedKeywords: [], drugCategory: detectDrug(text), refusalTrigger: true };
  }

  const yellowHit = allLangPhrases(lexicon.yellow).filter((p) => text.includes(p.toLowerCase()));
  if (yellowHit.length > 0) {
    return { tier: "YELLOW", matchedKeywords: yellowHit, drugCategory: detectDrug(text), refusalTrigger: false };
  }

  const greenHit = allLangPhrases(lexicon.green).filter((p) => text.includes(p.toLowerCase()));
  if (greenHit.length > 0) {
    return { tier: "GREEN", matchedKeywords: greenHit, drugCategory: detectDrug(text), refusalTrigger: false };
  }

  return { tier: "UNKNOWN", matchedKeywords: [], drugCategory: detectDrug(text), refusalTrigger: false };
}

export function detectAgeFlagLocal(rawText) {
  const text = normalise(rawText);
  const match = text.match(/\b(1[0-7]|[6-9])\s*(years old|year old|yrs|makore)\b/);
  if (match) {
    const age = parseInt(match[1], 10);
    if (age >= 6 && age <= 17) return age;
  }
  return null;
}
