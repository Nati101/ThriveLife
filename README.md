# ThriveLife

Real-time **capacity-navigation** app based on *Live Recharged* by Joel Pukalo.

Helps adults notice low energy, identify which Life Battery is most depleted, and take the smallest effective recharge action — without shame, streaks, or clinical diagnosis.

> **Core promise:** Understand what is draining you and take the next right step to recharge.

## Status

Phase 0 web foundation is runnable. Product engine (scoring, persistence, real auth) comes next.

**Repo:** https://github.com/Nati101/ThriveLife (private, solo Dev account). Plan to **transfer into a GitHub organization** later — see [docs/TASKS.md](docs/TASKS.md) Phase 0.1.

| Document | Purpose |
|----------|---------|
| [docs/SPEC-SUMMARY.md](docs/SPEC-SUMMARY.md) | Concise product & architecture summary |
| [docs/TASKS.md](docs/TASKS.md) | Phased, actionable build checklist |
| [docs/QUESTIONS.md](docs/QUESTIONS.md) | Clarifying questions & open risks |
| [docs/ThriveLife-Developer-Specification-v1.txt](docs/ThriveLife-Developer-Specification-v1.txt) | Full developer spec (plaintext) |

## Decisions locked

- **Web app** for V1 (native mobile deferred)
- **Same app with roles** — `user` | `editor` | `reviewer` | `admin` (not a separate admin app)
- Solo private GitHub ownership now → org migration later
- **Stack:** Next.js (App Router) + TypeScript + Tailwind in an npm workspaces monorepo
- **Backend path:** Next.js full-stack now; Postgres when Phase 2 schema lands
- **Auth path:** Clerk (stub session locally until Phase 9); Auth.js is the fallback if we prefer self-hosted sessions
- **Hosting note:** Prefer a **Canada** region for assessment data (Alberta PIPA / PIPEDA). Confirm with Legal before beta.

## Run locally

Requires Node 20+.

```bash
git clone git@github.com:Nati101/ThriveLife.git
cd ThriveLife
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
curl http://localhost:3000/api/health
npm run typecheck
npm run lint
```

### Local roles (stub auth)

Until Clerk is wired, open **/dev/role** to switch `user` / `editor` / `reviewer` / `admin`. Middleware fail-closes `/admin/*` for users without content-tool roles; `/admin/thresholds` requires `admin`.

### Environment

```bash
cp .env.example .env
```

No secrets are required for the scaffold. Clerk keys will be documented in `.env.example` when Phase 9 starts.

## Repo layout

```
ThriveLife/
├── apps/web/             # Next.js app (member + role-gated /admin)
├── packages/shared/      # Domain types + fixture content
├── services/             # Reserved for workers / future API split
├── admin/                # Deprecated stub — see admin/README.md
└── docs/                 # Spec, tasks, questions
```

## Routes (scaffold)

| Path | Purpose |
|------|---------|
| `/` | Brand home + domain overview |
| `/onboarding` | Eight-step onboarding skeleton |
| `/dashboard` | Seven-battery placeholder dashboard |
| `/check-in` | Daily Check-In UI stub |
| `/assessments` | Instrument index |
| `/assessments/drain-check` | DRAIN Check fixtures |
| `/assessments/battery-scan` | Battery Scan fixtures |
| `/assessments/full-assessment` | Full Assessment fixture map |
| `/assessments/weekly-mode-check` | Driving Mode check stub |
| `/admin` | Content tools hub (editor+) |
| `/admin/content` | Fixture content library |
| `/admin/thresholds` | Provisional scoring thresholds (admin) |
| `/dev/role` | Local role switcher |
| `/api/health` | Health check JSON |

Fixture copy is labeled `[FIXTURE]` — not Joel-authored and not clinical claims.

## Domain snapshot

- **7 Life Batteries** × **3 dimensions** (Capacity, Strain, Recharge Skill) — never averaged
- **4 instruments:** DRAIN Check, Battery Scan, Full Assessment (56 items), Weekly Mode Check
- **Driving Modes:** Green / Yellow / Red (user-declared)
- **Recharge:** 60s / 2 / 5 / 10 min with Plan A / Plan B
- **Admin-editable** scoring thresholds and recommendation lookup tables

## Build phases (high level)

0. Foundation & stack decisions ← **in progress / scaffold done**  
1. Content architecture (Joel)  
2. Data model & admin  
3. Assessment engine  
4. Dashboard & recommendations  
5. Daily loop  
6. Onboarding  
7. Safety & privacy *(beta gate)*  
8. Pilot telemetry *(beta gate)*  

Details: [docs/TASKS.md](docs/TASKS.md)

## Out of scope for V1

Team features, teen accounts, subscriptions, gamification, AI emotional analysis, faith-based pathway, workplace reporting — see spec §11.9.

## Confidentiality

This repository may contain product specification material marked **CONFIDENTIAL — NOT FOR DISTRIBUTION**. Keep the remote **private** unless explicitly cleared for public release.
