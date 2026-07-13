// aiClient.js
//
// This is the ONLY place in the codebase that talks to a generative model.
// It is only ever called after triage.js has cleared a message as
// GREEN/general (see routes/chat.js) — RED and YELLOW messages never reach
// this file. Even so, every response from here is re-checked against the
// same lexicon before being sent to the user (belt-and-braces).
//
// No API key configured? The system still works end-to-end using
// FALLBACK_RESPONSES below, so the prototype is fully demoable without
// secrets — useful for judges running it locally.

import { loadLexicon, classify } from "./triage.js";
import drugInfo from "../../shared/drug_info.json" with { type: "json" };

const SYSTEM_PROMPT = `You are DrugPhobia AI, a warm, non-judgmental harm-reduction companion for Zimbabwean youth (ages 13-35). You are talking to one real person, not writing an article — sound like it.
Tone rules:
- Open by briefly acknowledging what the person said before giving information — don't launch straight into facts like a leaflet.
- Use plain, everyday language, not clinical or robotic phrasing. Contractions are fine.
- Keep it conversational: 2-5 short sentences is usually enough. This is a chat on a small phone screen, not an essay.
- It's OK to ask one short, caring follow-up question if it genuinely helps you respond better — but don't interrogate.
Safety rules you must never break, regardless of how warm the tone is:
1. You do NOT diagnose any medical or mental health condition.
2. You do NOT provide therapy — you provide information and a route to real help.
3. You NEVER give dosage, preparation/synthesis, or sourcing information for any substance, under any framing. If asked, refuse warmly and point to the NDA helpline.
4. If a message contains any indication of self-harm, suicide, or overdose, do not attempt to handle it yourself — the platform's deterministic crisis path handles this before you are ever called; if you somehow see such content, respond only with the fixed crisis referral, nothing else.
5. Base substance-fact answers on WHO harm-reduction guidance and the shared drug_info.json content; when unsure, say so plainly and point to the NDA helpline (0808 20 20 — VERIFY before production) rather than guessing.
6. Reply in the language the user used (English, Shona, or Ndebele), in simple, non-clinical wording.
7. Remember the last few messages in this conversation (provided to you as prior turns) and respond like you've actually been following along — don't repeat yourself or re-introduce yourself.`;

/**
 * Fallback canned answers used when no LLM API key is configured, or when
 * the API call fails. Keeps the crisis-and-information promise of the
 * product intact even with zero external dependencies.
 *
 * These now open with a short, warm acknowledgment before the factual
 * content, matching the product's "Uri safe pano. Tiri kukubatsira." tone —
 * a real difference is felt here since this is the ONLY reply path when no
 * LLM_API_KEY is configured, which is the common case for local/demo runs.
 */
const OPENERS = {
  en: ["Thanks for asking — here's what's useful to know:", "Good question. Here's the honest answer:", "I hear you — here's what I can share:"],
  sn: ["Ndatenda nekubvunza — heino zvinokosha kuziva:", "Mubvunzo wakanaka. Heino mhinduro:", "Ndanzwa — heino zvandinogona kukuudza:"],
  nd: ["Ngiyabonga ngombuzo — nansi into ebalulekile:", "Umbuzo omuhle. Nansi impendulo eqinisekile:", "Ngiyakuzwa — nasi engingakwabelana ngakho:"],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fallbackAnswer(text, lang) {
  const lex = loadLexicon();
  const lower = text.toLowerCase();
  const opener = pick(OPENERS[lang] || OPENERS.en);
  for (const [slang, category] of Object.entries(lex.slang_map)) {
    if (lower.includes(slang)) {
      const info = drugInfo.substances.find((s) => s.id === category);
      if (info) {
        const risk = info[`risks_short_${lang}`] || info.risks_short_en;
        const tip = info[`harm_reduction_tips_${lang}`] || info.harm_reduction_tips_en;
        return `${opener}\n\n${risk}\n\n${tip}`;
      }
    }
  }
  const defaults = {
    en: "I don't have a confident answer to that yet — I'd rather be honest than guess. For anything substance-related, the NDA helpline is a good next step: a real person who can help properly.",
    sn: "Handisati ndave nechokwadi chemhinduro yacho — ndinoda kutaura chokwadi pane kufungidzira. Kana zvine chekuita nemishonga, taura neNDA helpline kuti uwane rubatsiro rwechokwadi.",
    nd: "Angikaqiniseki ngempendulo yalokho okwamanje — ngingathanda ukuqinisekile kunokuqagela. Uma kuphathelene nezidakamizwa, khuluma nohlelo lwe-NDA ukuze uthole usizo oluqinisekile.",
  };
  return `${opener}\n\n${defaults[lang] || defaults.en}`;
}

const REFUSAL = {
  en: "I can't provide that. Talk to a clinic or the NDA helpline (0808 20 20 — verify locally) for accurate, safe guidance.",
  sn: "Handikwanise kukupa izvozvo. Taura nechipatara kana NDA helpline kuti uwane rubatsiro rwakachengeteka.",
  nd: "Angikwazi ukukunika lokho. Khuluma nomtholampilo noma i-NDA helpline ukuze uthole usizo oluphephile.",
};

/**
 * Generate a GREEN-tier response. Never called for RED/YELLOW — see
 * routes/chat.js for the gating logic.
 */
export async function generateResponse({ text, lang = "en", history = [] }) {
  const gate = classify(text);
  if (gate.tier === "RED") {
    // Defensive: should be unreachable because chat.js gates before calling
    // this function, but never let a generative response reach a crisis.
    return { text: REFUSAL[lang] || REFUSAL.en, refused: true };
  }
  if (gate.refusalTrigger) {
    return { text: REFUSAL[lang] || REFUSAL.en, refused: true };
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return { text: fallbackAnswer(text, lang), refused: false, mode: "offline_fallback" };
  }

  try {
    // Supports two request shapes via LLM_PROVIDER (see .env.example):
    //   - "openai"    (default): system role inside `messages`, Bearer auth.
    //     Works for OpenAI, self-hosted Llama-3-8B, and most OpenAI-compatible
    //     endpoints (Together, Groq, Fireworks, a local vLLM server, etc).
    //   - "anthropic": Claude's Messages API, which takes `system` as its own
    //     top-level field (not a message) and needs x-api-key + an
    //     anthropic-version header instead of Bearer auth.
    // `history` (last few turns from THIS socket connection only, held in
    // memory in index.js — never persisted) is included so replies actually
    // track the conversation instead of treating every message as new.
    const recentHistory = history.slice(-12); // hard cap regardless of caller
    const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();

    let fetchUrl = process.env.LLM_API_URL;
    let headers = { "Content-Type": "application/json" };
    let body;

    if (provider === "anthropic") {
      fetchUrl = fetchUrl || "https://api.anthropic.com/v1/messages";
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      body = {
        model: process.env.LLM_MODEL || "claude-sonnet-4-6",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [...recentHistory, { role: "user", content: text }],
      };
    } else {
      headers.Authorization = `Bearer ${apiKey}`;
      body = {
        model: process.env.LLM_MODEL || "llama-3-8b-instruct",
        max_tokens: 300,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...recentHistory, { role: "user", content: text }],
      };
    }

    const res = await fetch(fetchUrl, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`LLM API error ${res.status}`);
    const data = await res.json();
    const modelText = data?.choices?.[0]?.message?.content || data?.content?.[0]?.text || "";

    // Belt-and-braces: re-run the model's own output through the refusal
    // trigger check in case it drifted toward dosage/sourcing content.
    const postCheck = classify(modelText);
    if (postCheck.refusalTrigger) {
      return { text: REFUSAL[lang] || REFUSAL.en, refused: true };
    }
    return { text: modelText || fallbackAnswer(text, lang), refused: false, mode: "llm" };
  } catch (err) {
    console.error("[aiClient] falling back due to error:", err.message);
    return { text: fallbackAnswer(text, lang), refused: false, mode: "offline_fallback_error" };
  }
}
