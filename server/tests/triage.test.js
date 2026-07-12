// triage.test.js
//
// This is the single most important test file in the repository. It is the
// release gate described in Section 3.3 of the AI4I proposal: recall on the
// RED-tier crisis set must be effectively 100% before every deploy. Run
// with: node --test tests/
//
// Add new real-world phrasings here as they're discovered in moderation
// review — this file should only ever grow.

import test from "node:test";
import assert from "node:assert/strict";
import { classify, detectAgeFlag } from "../src/triage.js";

const RED_CASES_EN = [
  "I want to kill myself",
  "I think I'm going to overdose tonight",
  "I just cut myself again",
  "there's no reason to live anymore",
  "my friend is not breathing after huffing glue",
];

const RED_CASES_SN = [
  "ndinoda kufa",
  "ndazvicheka",
  "handisisade kurarama",
];

const RED_CASES_ND = [
  "ngizabulala",
  "ngizigwaze",
  "kawusaphefumuli",
];

test("RED tier: English crisis phrasing always triggers the crisis card", () => {
  for (const text of RED_CASES_EN) {
    const result = classify(text);
    assert.equal(result.tier, "RED", `expected RED for: "${text}"`);
  }
});

test("RED tier: Shona crisis phrasing always triggers the crisis card", () => {
  for (const text of RED_CASES_SN) {
    const result = classify(text);
    assert.equal(result.tier, "RED", `expected RED for: "${text}"`);
  }
});

test("RED tier: Ndebele crisis phrasing always triggers the crisis card", () => {
  for (const text of RED_CASES_ND) {
    const result = classify(text);
    assert.equal(result.tier, "RED", `expected RED for: "${text}"`);
  }
});

test("RED tier is case-insensitive and tolerates surrounding text", () => {
  const result = classify("honestly I just want to KILL MYSELF right now please help");
  assert.equal(result.tier, "RED");
});

test("YELLOW tier catches moderate-risk phrasing without breaking the chat", () => {
  const result = classify("I've been using guka everyday and I can't stop");
  assert.equal(result.tier, "YELLOW");
});

test("GREEN tier catches low-risk phrasing", () => {
  const result = classify("I'm just really stressed about exams");
  assert.equal(result.tier, "GREEN");
});

test("Dosage/sourcing questions trigger the refusal flag, not a RED/YELLOW misfire", () => {
  const result = classify("how much mbanje should i take to feel it");
  assert.equal(result.refusalTrigger, true);
});

test("Refusal trigger still fires with a different substance name inserted mid-phrase", () => {
  assert.equal(classify("how much crystal meth should i take").refusalTrigger, true);
  assert.equal(classify("where can i buy some guka around here").refusalTrigger, true);
});

test("Slang is correctly mapped to a drug category for admin analytics", () => {
  const result = classify("I tried mutoriro last week and felt sick");
  assert.equal(result.drugCategory, "codeine_cough_syrup");
});

test("Unrelated messages return UNKNOWN, not a false-safe GREEN", () => {
  const result = classify("what time does the library close");
  assert.equal(result.tier, "UNKNOWN");
});

test("Age flag detects an under-18 disclosure conservatively", () => {
  assert.equal(detectAgeFlag("I am 14 years old"), 14);
  assert.equal(detectAgeFlag("I'm 25 years old"), null);
  assert.equal(detectAgeFlag("just a normal message"), null);
});
