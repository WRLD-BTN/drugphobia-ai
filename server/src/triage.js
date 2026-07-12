// triage.js
//
// This module is the AUTHORITATIVE safety gate for DrugPhobia AI.
// It is deterministic on purpose: RED/YELLOW/GREEN classification never
// depends on a probabilistic model. See Section 2.2 of the AI4I proposal
// for the rationale (a rule engine is the right tool for a decision that
// must be 100% explainable and testable before every release).
//
// The LLM layer (see aiClient.js) is only ever consulted AFTER this gate
// has cleared a message as GREEN/general — and even then, a second pass
// through this same lexicon intercepts anything the LLM might otherwise
// have tried to answer unsafely.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEXICON_PATH = path.resolve(__dirname, "../../shared/lexicon.json");

let lexicon = null;
export function loadLexicon() {
  if (!lexicon) {
    lexicon = JSON.parse(fs.readFileSync(LEXICON_PATH, "utf-8"));
  }
  return lexicon;
}

function normalise(text) {
  return text.toLowerCase().normalize("NFKC").trim();
}

function anyMatch(text, phrases) {
  return phrases.some((p) => text.includes(p.toLowerCase()));
}

/**
 * Looser matcher used only for dosage/sourcing refusal triggers, where real
 * messages naturally insert a substance name mid-phrase (e.g. "how much
 * MBANJE should i take" rather than the literal "how much should i take").
 * Checks that every word of the trigger phrase appears in the text in
 * order, allowing other words in between — still deterministic and
 * auditable, just not limited to an exact contiguous substring.
 */
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
  // bucket looks like { en: [...], sn: [...], nd: [...] }, skip _comment
  return Object.entries(bucket)
    .filter(([lang]) => lang !== "_comment")
    .flatMap(([, phrases]) => phrases);
}

/**
 * Classify a single message.
 * @param {string} rawText
 * @returns {{tier: 'RED'|'YELLOW'|'GREEN'|'UNKNOWN', matchedKeywords: string[], drugCategory: string|null, refusalTrigger: boolean}}
 */
export function classify(rawText) {
  const lex = loadLexicon();
  const text = normalise(rawText);
  const matched = [];

  // 1. Crisis check first — always. This must be the first thing evaluated.
  const redPhrases = allLangPhrases(lex.red);
  const redHit = redPhrases.filter((p) => text.includes(p.toLowerCase()));
  if (redHit.length > 0) {
    return { tier: "RED", matchedKeywords: redHit, drugCategory: detectDrug(text, lex), refusalTrigger: false };
  }

  // 2. Dosage / sourcing refusal check — must short-circuit before any AI call.
  // Uses wordsInOrder (not a strict substring) because real messages insert
  // the substance name mid-phrase, e.g. "how much mbanje should i take".
  const refusalPhrases = allLangPhrases(lex.dosage_or_sourcing_refusal_triggers);
  const refusalHit = refusalPhrases.some((p) => wordsInOrder(text, p));
  if (refusalHit) {
    return { tier: "GREEN", matchedKeywords: [], drugCategory: detectDrug(text, lex), refusalTrigger: true };
  }

  // 3. Moderate risk.
  const yellowPhrases = allLangPhrases(lex.yellow);
  const yellowHit = yellowPhrases.filter((p) => text.includes(p.toLowerCase()));
  if (yellowHit.length > 0) {
    return { tier: "YELLOW", matchedKeywords: yellowHit, drugCategory: detectDrug(text, lex), refusalTrigger: false };
  }

  // 4. Low risk / general.
  const greenPhrases = allLangPhrases(lex.green);
  const greenHit = greenPhrases.filter((p) => text.includes(p.toLowerCase()));
  if (greenHit.length > 0) {
    return { tier: "GREEN", matchedKeywords: greenHit, drugCategory: detectDrug(text, lex), refusalTrigger: false };
  }

  // 5. Nothing matched the deterministic layer — defer to the client-side
  // classifier / LLM general layer. UNKNOWN is not a risk verdict, it just
  // means "the rule engine has no opinion," so downstream code must NOT
  // treat this as safe-by-default for anything crisis-related.
  return { tier: "UNKNOWN", matchedKeywords: [], drugCategory: detectDrug(text, lex), refusalTrigger: false };
}

function detectDrug(text, lex) {
  for (const [slang, category] of Object.entries(lex.slang_map)) {
    if (text.includes(slang.toLowerCase())) return category;
  }
  return null;
}

/**
 * Age-flag detector — looks for a disclosed age under 18.
 * Deliberately simple and conservative: only fires on explicit digit
 * patterns, never inferred from writing style.
 */
export function detectAgeFlag(rawText) {
  const text = normalise(rawText);
  const match = text.match(/\b(1[0-7]|[6-9])\s*(years old|year old|yrs|makore)\b/);
  if (match) {
    const age = parseInt(match[1], 10);
    if (age >= 6 && age <= 17) return age;
  }
  return null;
}
