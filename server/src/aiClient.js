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

const SYSTEM_PROMPT = `You are DrugPhobia AI, a harm-reduction information assistant for Zimbabwean youth (ages 13-35).
Rules you must never break:
1. You do NOT diagnose any medical or mental health condition.
2. You do NOT provide therapy — you provide information and a route to real help.
3. You NEVER give dosage, preparation/synthesis, or sourcing information for any substance, under any framing. If asked, refuse and point to the NDA helpline.
4. If a message contains any indication of self-harm, suicide, or overdose, do not attempt to handle it yourself — the platform's deterministic crisis path handles this before you are ever called; if you somehow see such content, respond only with the fixed crisis referral, nothing else.
5. Base substance-fact answers on WHO harm-reduction guidance and the shared drug_info.json content; when unsure, say so and point to the NDA helpline (0808 20 20 — VERIFY before production) rather than guessing.
6. Reply in the language the user used (English, Shona, or Ndebele), in simple, non-clinical wording.
7. Keep responses short — this is a chat interface on low-bandwidth phones, not an essay.`;

/**
 * Fallback canned answers used when no LLM API key is configured, or when
 * the API call fails. Keeps the crisis-and-information promise of the
 * product intact even with zero external dependencies.
 */
function fallbackAnswer(text, lang) {
  const lex = loadLexicon();
  const lower = text.toLowerCase();
  for (const [slang, category] of Object.entries(lex.slang_map)) {
    if (lower.includes(slang)) {
      const info = drugInfo.substances.find((s) => s.id === category);
      if (info) {
        const risk = info[`risks_short_${lang}`] || info.risks_short_en;
        const tip = info[`harm_reduction_tips_${lang}`] || info.harm_reduction_tips_en;
        return `${risk}\n\n${tip}`;
      }
    }
  }
  const defaults = {
    en: "I don't have a confident answer to that yet. For anything substance-related, the NDA helpline is a good next step — talk to a real person who can help.",
    sn: "Handisati ndave nechokwadi chemhinduro yacho. Kana zvine chekuita nemishonga, taura neNDA helpline kuti uwane rubatsiro rwechokwadi.",
    nd: "Angikaqiniseki ngempendulo yalokho okwamanje. Uma kuphathelene nezidakamizwa, khuluma nohlelo lwe-NDA ukuze uthole usizo.",
  };
  return defaults[lang] || defaults.en;
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
export async function generateResponse({ text, lang = "en" }) {
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
    // Provider-agnostic call shape; point LLM_API_URL/LLM_MODEL at whichever
    // guarded endpoint the team wires up (self-hosted Llama-3-8B on the
    // ZCHPC CCE, or a hosted API) — see .env.example.
    const res = await fetch(process.env.LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "llama-3-8b-instruct",
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });
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
