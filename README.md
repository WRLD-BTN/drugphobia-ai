# DrugPhobia AI

Anonymous, multilingual (English / Shona / Ndebele) harm-reduction triage and
referral platform for Zimbabwean youth (13–35). Built for the **AI4I 2026
Challenge — Track 3 (Development)**. See the accompanying formal proposal,
`AI4I2026-DEV_DrugPhobiaAI_AI4I_Proposal_Development.pdf`, for the full
problem statement, architecture rationale, and compliance plan this
codebase implements.

> **Not medical advice or therapy.** This platform never diagnoses, never
> gives dosage/synthesis/sourcing information, and always routes anything
> resembling a crisis to a real human helpline. See [Section 4](#4-safety-design-read-this-first)
> before touching the triage code.

---

## Contents

- [1. Monorepo layout](#1-monorepo-layout)
- [2. Quick start (local, no Docker)](#2-quick-start-local-no-docker)
- [3. Quick start (Docker Compose)](#3-quick-start-docker-compose)
- [4. Safety design — read this first](#4-safety-design-read-this-first)
- [5. Admin account setup](#5-admin-account-setup)
- [6. Environment variables](#6-environment-variables)
- [7. Guarded LLM layer (optional)](#7-guarded-llm-layer-optional)
- [8. Migrating to Supabase Postgres / ZCHPC CCE](#8-migrating-to-supabase-postgres--zchpc-cce)
- [9. Testing](#9-testing)
- [10. Data protection & POPIA / Zimbabwe Data Protection Act notes](#10-data-protection--popia--zimbabwe-data-protection-act-notes)
- [11. Before this goes anywhere near real users](#11-before-this-goes-anywhere-near-real-users)

---

## 1. Monorepo layout

```
drugphobia-ai/
├── shared/                  # Content both apps and the server read: lexicon,
│                             # drug info, quiz bank, Did You Know cards, clinics
│   ├── lexicon.json          # THE authoritative crisis/risk keyword rules
│   ├── drug_info.json
│   ├── quiz_bank.json
│   ├── research_db.json
│   └── clinics.json          # helplines + facility directory (see verified:false notes)
│
├── server/                  # Node/Express + Socket.io backend
│   ├── src/
│   │   ├── index.js          # entrypoint: HTTP + Socket.io gateway
│   │   ├── triage.js          # deterministic rule engine (the safety gate)
│   │   ├── aiClient.js        # guarded LLM call, only for GREEN-tier Q&A
│   │   ├── db.js              # SQLite (dev) schema + 24h auto-purge cron
│   │   ├── routes/            # chat, resources, quiz, admin
│   │   └── middleware/        # JWT auth/RBAC, rate limiting
│   ├── tests/triage.test.js   # crisis-lexicon regression suite — the release gate
│   ├── createAdmin.js         # bootstrap the first admin account
│   ├── sql/schema.sql         # Postgres-flavour schema for Supabase/production
│   └── Dockerfile
│
├── client/                  # React + Vite + Tailwind PWA (youth-facing)
│   ├── src/classifier/triageClient.js  # offline-first mirror of triage.js
│   ├── src/components/        # ChatWindow, CrisisCard, QuizModule, etc.
│   └── Dockerfile + nginx.conf
│
├── admin/                    # React + Vite admin/moderation dashboard
│   ├── src/pages/             # Login, Dashboard, Moderation, ResourceManager
│   └── Dockerfile
│
├── docker-compose.yml
└── .env.example               # root env for docker-compose
```

---

## 2. Quick start (local, no Docker)

Requires Node.js 20+ (tested on 22) and no other external services — the
prototype runs entirely offline out of the box (SQLite + a canned-answer
fallback instead of a live LLM).

```bash
# 1. Server
cd server
cp .env.example .env          # edit JWT_SECRET at minimum
npm install
npm run createAdmin -- "you@example.org" "a-strong-password-here"
npm run dev                    # http://localhost:4000

# 2. Client (separate terminal)
cd client
cp .env.example .env.local
npm install
npm run dev                    # http://localhost:5173

# 3. Admin dashboard (separate terminal)
cd admin
cp .env.example .env.local
npm install
npm run dev                    # http://localhost:5174
```

Run the safety-critical test suite before you touch anything:

```bash
cd server && npm test
```

---

## 3. Quick start (Docker Compose)

```bash
cp .env.example .env           # edit JWT_SECRET at minimum
docker compose up --build
```

- Client (PWA): http://localhost:8080
- Admin dashboard: http://localhost:8081
- Server API: http://localhost:4000

Then bootstrap an admin account inside the running server container:

```bash
docker compose exec server node createAdmin.js "you@example.org" "a-strong-password-here"
```

---

## 4. Safety design — read this first

The RED/YELLOW/GREEN triage decision is made by a **deterministic keyword
rule engine** (`shared/lexicon.json` + `server/src/triage.js`), never by a
probabilistic model. This is intentional, not a missing feature — see
Section 2.2 of the proposal for the full rationale. If you're adding a new
crisis phrase:

1. Add it to `shared/lexicon.json` under the right language/tier.
2. Add a regression case to `server/tests/triage.test.js`.
3. Run `npm test` in `server/` — it must stay at 100% pass before you merge.

The guarded LLM (`server/src/aiClient.js`) is **only ever consulted after**
the rule engine has cleared a message as GREEN. It re-checks its own output
against the same lexicon before returning it to the user (belt-and-braces).
With no `LLM_API_KEY` set, the whole product still works end-to-end using a
canned, drug-info-grounded fallback — useful for judges running this with
zero secrets configured.

---

## 5. Admin account setup

There is no public sign-up endpoint for `/admin/*` routes. The only
supported way to create an admin is:

```bash
cd server
node createAdmin.js "you@example.org" "a-strong-password-here" [role]
# role defaults to "admin"; other options: "moderator", "superadmin"
```

Only a **hash** of the email is stored (`utils/sanitize.js:hashEmail`) —
the plaintext email never touches the database.

---

## 6. Environment variables

See the `.env.example` file in each of `server/`, `client/`, `admin/`, and
the repo root — each is commented inline. The short version:

| Variable | Where | Purpose |
|---|---|---|
| `JWT_SECRET` | server | Signs 15-minute admin session tokens. **Must** be set before any real deployment. |
| `SQLITE_PATH` | server | Local dev DB path. Swap for Supabase Postgres in production (see §8). |
| `LLM_API_KEY` / `LLM_API_URL` / `LLM_MODEL` | server | Optional — enables the live conversational layer. Leave blank to run fully offline. |
| `VITE_SERVER_URL` | client, admin | Where the frontend reaches the backend API. |
| `CORS_ORIGIN` | server | Comma-separated list of allowed frontend origins. |

---

## 7. Guarded LLM layer (optional)

`server/src/aiClient.js` is provider-agnostic: point `LLM_API_URL` at a
self-hosted quantised Llama-3-8B-Instruct endpoint on the ZCHPC CCE, or at a
hosted API, using the same `messages` shape shown in the file. The system
prompt hard-codes the product's non-negotiable rules (no diagnosis, no
dosage/synthesis/sourcing, always defer crisis content to the deterministic
path). If you swap models, re-run `server/tests/triage.test.js` and manually
sanity-check a handful of GREEN-tier conversations before shipping.

---

## 8. Migrating to Supabase Postgres / ZCHPC CCE

Local dev uses SQLite (`server/src/db.js`) so nobody needs external infra to
run the prototype. For a real deployment:

1. Create a Supabase project (or any managed Postgres).
2. Run `server/sql/schema.sql` against it — note it also enables Row-Level
   Security with **no policies**, so only the service-role key (used
   server-side only) can read/write. Never expose that key to a browser.
3. Swap `better-sqlite3` calls in `src/db.js` for a Postgres client (e.g.
   `pg` or Supabase's JS client) using the service role key from an
   environment variable — the SQL is written to be portable, so this is a
   mechanical rewrite of `db.js`, not a schema redesign.
4. Point the containerised build at the ZCHPC Cloud Computing Environment
   per the roadmap in Section 3 of the proposal.

---

## 9. Testing

```bash
cd server
npm test
```

This runs `server/tests/triage.test.js` — the crisis-lexicon regression
suite described in Section 3.3 of the proposal. It is the release gate:
every RED-tier phrasing in the test set must classify as RED before you
deploy. Add new real-world phrasings here as moderators discover them.

> Note: this sandbox environment has no outbound network access, so full
> `npm install` across all three apps (client/admin need internet to pull
> React, Vite, Tailwind, etc.) couldn't be executed here. The triage engine
> — the one piece with zero external dependencies — was installed and
> tested directly; run `npm install` yourself in each of `server/`,
> `client/`, and `admin/` before first use.

---

## 10. Data protection & POPIA / Zimbabwe Data Protection Act notes

- No name, phone number, or IP address is ever stored. The only persistent
  identifier is a randomly generated `session_hash` (e.g. `User#4832-a1b2c3d4`).
- Chat message **text** is never written to disk — only aggregate flags
  (`crisis_flag`, `language`, `drug_category_detected`, `age_flag`,
  `triggered_keywords`) are logged, in `chats_metadata`.
- `chats_metadata` rows are purged automatically after 24 hours by an
  hourly cron job (`server/src/db.js:scheduleHourlyPurge`).
- The disclaimer shown before a user's first message (`client/src/components/Disclaimer.jsx`)
  describes this data handling in plain English, Shona, and Ndebele.
- Admin accounts store a **hash** of the email, never the plaintext.

---

## 11. Before this goes anywhere near real users

This is a hackathon-stage MVP. Do not treat it as production-ready until:

- **Every `VERIFY_*` placeholder in `shared/clinics.json` is replaced** with
  a phone number confirmed directly with NDA Zimbabwe, MoHCC, or the named
  facility. Publishing a wrong crisis number is a real safety risk — this
  was deliberately left unverified rather than guessed at during this build.
  See the `_todo_before_pilot` note inside that file.
- A clinical/NGO partner (NDA-affiliated, Friendship Bench, or similar) has
  reviewed `shared/drug_info.json`, `shared/lexicon.json`, and
  `shared/research_db.json` for accuracy.
- The crisis-lexicon regression suite has been extended with real
  moderator-observed phrasing, not just the seed set in this repo.
- A real ethics/data-sharing agreement is in place before connecting any
  anonymised crisis-line call metadata to calibrate the classifier (see the
  proposal's Dataset Statement, Section 2.5).
