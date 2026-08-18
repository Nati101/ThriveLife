# ThriveLife

Real-time **capacity-navigation** app based on *Live Recharged* by Joel Pukalo.

Helps adults notice low energy, identify which Life Battery is most depleted, and take the smallest effective recharge action — without shame, streaks, or clinical diagnosis.

> **Core promise:** Understand what is draining you and take the next right step to recharge.

## Status

V1 **web beta** against Developer Specification v1.0: Phases 0–9 are implemented with **fixture content** (labeled `[FIXTURE]`). This is **not** clinical validation.

- **Runtime:** Vite + React + TypeScript. `npm run dev` uses a local JSON store via `/api` middleware.
- **Database:** Supabase Postgres in **Canada Central (`ca-central-1`)**, project `ThriveLife` (`bpbfezmierdtproczkpj`). Schema, RLS, and fixture seed are live. Member sessions in local dev still write to `apps/web/data/sessions.json`.
- **Auth:** Supabase Auth is the production identity store. Roles live in `profiles` / `app_metadata` — never `user_metadata`. `/dev/role` is a **DEV-only** stub.
- **Compliance:** [docs/SPEC-COMPLIANCE.md](docs/SPEC-COMPLIANCE.md)

**Repo:** https://github.com/Nati101/ThriveLife (private). Do not claim psychometric validity.

| Document | Purpose |
|----------|---------|
| [docs/SPEC-SUMMARY.md](docs/SPEC-SUMMARY.md) | Concise product & architecture summary |
| [docs/TASKS.md](docs/TASKS.md) | Phased build checklist |
| [docs/SPEC-COMPLIANCE.md](docs/SPEC-COMPLIANCE.md) | Spec requirement → Pass / Partial / Fail |
| [docs/CONTENT-PACKAGE.md](docs/CONTENT-PACKAGE.md) | Fixture package Joel can swap |
| [docs/QUESTIONS.md](docs/QUESTIONS.md) | Clarifying questions & open risks |
| [docs/ThriveLife-Developer-Specification-v1.txt](docs/ThriveLife-Developer-Specification-v1.txt) | Full developer spec |

## Decisions locked

- **Web app** for V1 (native mobile deferred)
- **Same app with roles** — `user` | `editor` | `reviewer` | `admin`
- **Stack:** Vite + React + TypeScript + Tailwind + React Router
- **Database:** Supabase Postgres (`ca-central-1`). Local JSON for offline/dev
- **Auth:** Supabase Auth (one identity store). Stub `/dev/role` in development only
- Hosting: prefer **Canada**; Legal confirm before public beta

## Run locally

Requires Node 20+.

```bash
git clone git@github.com:Nati101/ThriveLife.git
cd ThriveLife
npm install
cp .env.example apps/web/.env.local
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (publishable only — never service_role)
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

```bash
npm test
npm run typecheck
npm run build
```

### Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | `apps/web/.env.local` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Publishable key (`sb_publishable_…`) |
| `VITE_SUPABASE_ANON_KEY` | optional | Legacy anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, never `VITE_*` | Optional admin scripts |

Canada note: cloud project region is **ca-central-1**. Legal still confirms PIPA/PIPEDA and cross-border before beta.

### Auth

- Production path: **/auth** (sign in / sign up, 18+ checkbox)
- Local stub: **/dev/role** (`user` / `editor` / `reviewer` / `admin`) — cookie `tl_dev_role`

### Admin

1. Role **editor** or **admin** at `/dev/role` (or a cloud profile role).
2. `/admin/content` — constructs, items, recharge, scales.
3. `/admin/copy` — result / safety / notification copy + draft → review → publish.
4. `/admin/thresholds` — admin only; audit log.

## Repo layout

```
ThriveLife/
├── apps/web/             # Vite + React + /api middleware
├── apps/web/data/        # Local JSON stores (gitignored)
├── packages/shared/      # Domain types, fixtures, scoring
├── supabase/             # Migrations + seed.sql
├── services/             # Reserved workers
└── docs/
```

## Confidentiality

Spec material may be **CONFIDENTIAL**. Keep the remote **private** unless cleared.
