# Base44 prior app — handoff & export guide

**Status (2026-08-07):** Prior Base44 codebase **not recovered locally**. Editor requires login.  
**Repo stack now:** **Vite + React + TypeScript** under `apps/web` (aligned with Base44; Next.js scaffold removed per client update).

**Related:** [QUESTIONS.md](./QUESTIONS.md) · [TASKS.md](./TASKS.md) · [README.md](../README.md)

---

## What we know

| Item | Detail |
|------|--------|
| Prior editor URL | [Base44 editor → `vite.config.js`](https://app.base44.com/apps/6a74e3c6a18bdd8e70a443ae/editor/workspace/code?filePath=vite.config.js) |
| App ID | `6a74e3c6a18bdd8e70a443ae` |
| Base44 stack (docs) | **React + Vite** + Tailwind + `@base44/sdk`; pages under `src/pages` |
| This repo today | Vite + React + TS + Tailwind + React Router (`apps/web`) + `@thrivelife/shared` fixtures |
| Access without credentials | **Blocked** — public fetch of the editor returns the SPA shell only / times out |

### Local search (2026-08-07)

Searched Downloads, Desktop, Documents, and this workspace for Base44 / ThriveLife source.

**Found:** spec/NDA docs only.  
**Not found:** Base44 ZIP, GitHub sync clone, or Vite project matching this app ID.

---

## Blocker — please export the Base44 project

We cannot pull UI, entities, or `@base44/sdk` wiring without the owner exporting. Pick **one**:

### Option 1 — Export ZIP (simplest)

1. Sign in at [app.base44.com](https://app.base44.com/) as app owner.
2. Open app `6a74e3c6a18bdd8e70a443ae`.
3. **Code** tab → **Export project as ZIP** (Builder plan or higher typically required).
4. Drop the ZIP into this workspace (e.g. `imports/base44-export/`) or share it with Dev.

### Option 2 — GitHub sync

1. App Dashboard → **GitHub** → connect and create a **private** repo (do not overwrite `Nati101/ThriveLife` until we merge intentionally).
2. Invite Dev as collaborator.

Env after clone (from Base44 docs):

```bash
VITE_BASE44_APP_ID=6a74e3c6a18bdd8e70a443ae
VITE_BASE44_APP_BASE_URL=https://<your-backend>.base44.app
```

### Option 3 — CLI eject (owner machine)

```bash
npm install -g base44@latest
base44 eject --app-id 6a74e3c6a18bdd8e70a443ae --path ./thrivelife-base44-export --yes
```

Schemas copy; **data does not**. Creates a separate Base44 backend project.

### Option 4 — Workspace invite

Invite Dev to the Base44 app so they can export themselves.

---

## Stack decision (made without the export)

| Choice | Why |
|--------|-----|
| **Vite + React + TypeScript** | Matches Base44’s documented project shape (`vite.config.js`, `src/pages`) |
| Keep monorepo + shared fixtures | Spec domain types stay usable while waiting on real UI |
| Backend / auth | Prefer Base44 SDK + auth **once export lands**; else Postgres + Clerk/Auth.js |

When the export arrives: merge pages/components/entities into `apps/web` (or replace the scaffold wholesale if the export is complete enough).

---

## Runnable today (without Base44 UI)

```bash
cd /Users/nati/Documents/GitHub/ThriveLife
npm install
npm run dev
```

Opens the Vite foundation + fixture content — **not** the client’s Base44 prototype UI.
