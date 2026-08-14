# ThriveLife

Real-time **capacity-navigation** app based on *Live Recharged* by Joel Pukalo.

Helps adults notice low energy, identify which Life Battery is most depleted, and take the smallest effective recharge action — without shame, streaks, or clinical diagnosis.

> **Core promise:** Understand what is draining you and take the next right step to recharge.

## Status

Phase 0–2 foundation is runnable on **Vite + React + TypeScript**. Phase 2 adds a **local JSON content store** + role-gated admin CRUD (fixtures until Joel’s package). Product scoring engine (Phase 3) and full Base44 UI still pending.

**Repo:** https://github.com/Nati101/ThriveLife (private).

| Document | Purpose |
|----------|---------|
| [docs/SPEC-SUMMARY.md](docs/SPEC-SUMMARY.md) | Concise product & architecture summary |
| [docs/TASKS.md](docs/TASKS.md) | Phased build checklist |
| [docs/QUESTIONS.md](docs/QUESTIONS.md) | Clarifying questions & open risks |
| [docs/BASE44-PRIOR-APP.md](docs/BASE44-PRIOR-APP.md) | **Base44 previous app — paste-from-editor (free plan)** |
| [docs/ThriveLife-Developer-Specification-v1.txt](docs/ThriveLife-Developer-Specification-v1.txt) | Full developer spec |

## Blocker — Base44 source needed

The client’s previous app lives at Base44 (`app id` `6a74e3c6a18bdd8e70a443ae`). Free plan cannot ZIP-export. **Paste files from the Base44 code editor** into `vendor/base44-prior/` — steps in [docs/BASE44-PRIOR-APP.md](docs/BASE44-PRIOR-APP.md). Until then this repo ships a Vite foundation + fixture content from the spec, not their live Base44 UI.

## Decisions locked

- **Web app** for V1 (native mobile deferred)
- **Same app with roles** — `user` | `editor` | `reviewer` | `admin`
- **Stack:** **Vite + React + TypeScript + Tailwind + React Router** (matches Base44; pivoted from an earlier Next.js scaffold)
- Shared domain package: `packages/shared`
- **Phase 2 persistence:** local JSON file (`apps/web/data/content-store.json`) via Vite `/api` middleware — swap to **Canada-region Postgres** later
- Auth: stub locally; prefer Base44 auth if we stay on their backend, else Clerk/Auth.js
- Hosting: prefer **Canada** region for assessment data (Legal confirm before beta)

## Run locally

Requires Node 20+.

```bash
git clone git@github.com:Nati101/ThriveLife.git
cd ThriveLife
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

```bash
curl http://127.0.0.1:3000/health.json
curl http://127.0.0.1:3000/api/health
npm run typecheck
npm run build
```

### Local roles (stub auth)

Open **/dev/role** to switch `user` / `editor` / `reviewer` / `admin`. `/admin` is fail-closed for users without content-tool roles; `/admin/thresholds` requires `admin`. Content API (`/api/content/*`) enforces the same matrix server-side using the `tl_dev_role` cookie.

### Admin CRUD (Phase 2)

1. Set role to **editor** (content) or **admin** (content + thresholds) at `/dev/role`.
2. Open `/admin/content` — edit constructs, items (version bump on wording change), recharge actions, response scales.
3. Open `/admin/thresholds` as **admin** — edit §4.3 bands; audit log records changes.
4. Store file is created on first API hit; admin can **Reset to fixtures** from the content overview.

## Repo layout

```
ThriveLife/
├── apps/web/             # Vite + React (Base44-aligned) + /api content middleware
├── apps/web/data/        # Local content-store.json (gitignored)
├── packages/shared/      # Domain types + fixture content + seed helper
├── services/             # Reserved for workers / Postgres API later
├── admin/                # Deprecated stub — in-app /admin routes
├── vendor/base44-prior/  # Pasted Base44 editor source (free plan)
└── docs/                 # Spec, tasks, Base44 notes
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Brand home + domain overview |
| `/onboarding` | Eight-step onboarding skeleton |
| `/dashboard` | Seven-battery placeholder |
| `/check-in` | Daily Check-In UI stub |
| `/assessments/*` | Four instruments (fixtures) |
| `/admin`, `/admin/content`, `/admin/thresholds` | Role-gated content tools (live CRUD) |
| `/dev/role` | Local role switcher |
| `/health.json` | Static health probe |
| `/api/health`, `/api/content/*` | Local content API (dev server) |

## Confidentiality

Spec material may be **CONFIDENTIAL**. Keep the remote **private** unless cleared.
