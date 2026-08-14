# Base44 prior app — handoff & recovery

**Status (2026-08-14):** Prior Base44 codebase **not recovered locally**. Owner is on the **free plan** (no ZIP export) and can already **see the code in the Base44 editor**. Recovery path: **paste from the editor** (or let an agent read the editor UI via Cursor Browser MCP after login).  
**Repo stack now:** **Vite + React + TypeScript** under `apps/web` (aligned with Base44).

**Related:** [QUESTIONS.md](./QUESTIONS.md) · [TASKS.md](./TASKS.md) · [README.md](../README.md) · drop folder [`vendor/base44-prior/`](../vendor/base44-prior/)

---

## What we know

| Item | Detail |
|------|--------|
| Prior editor URL | [Base44 editor → `vite.config.js`](https://app.base44.com/apps/6a74e3c6a18bdd8e70a443ae/editor/workspace/code?filePath=vite.config.js) |
| App ID | `6a74e3c6a18bdd8e70a443ae` |
| Base44 stack (docs) | **React + Vite** + Tailwind + `@base44/sdk`; pages under `src/pages` |
| This repo today | Vite + React + TS + Tailwind + React Router (`apps/web`) + `@thrivelife/shared` fixtures |
| Export ZIP | Not available on free plan — **do not upgrade just for this** |
| Access without login | **Blocked** — public fetch of the editor returns the SPA shell only |

### Local search (2026-08-07)

Searched Downloads, Desktop, Documents, and this workspace for Base44 / ThriveLife source.

**Found:** spec/NDA docs only.  
**Not found:** Base44 ZIP, GitHub sync clone, or Vite project matching this app ID.

---

## Free-plan path — paste from the editor (do this)

You already have the source in the Base44 **Code** workspace. Copy it into this repo. No paid export.

1. Sign in at [app.base44.com](https://app.base44.com/) in your own browser (do **not** send passwords in chat).
2. Open app `6a74e3c6a18bdd8e70a443ae` → **Code**.
3. Copy files into [`vendor/base44-prior/`](../vendor/base44-prior/) using the **same paths** as in the editor.
4. Start with `package.json`, then `vite.config.js` or `vite.config.ts`, then the whole `src/` tree.
5. Optionally paste a screenshot or text dump of the **file tree** so we know what is still missing.

Checklist and skip rules: [`vendor/base44-prior/README.md`](../vendor/base44-prior/README.md).

### Optional — Cursor Browser MCP

If **cursor-ide-browser** is enabled in Cursor **Settings → MCP**, an agent can open the editor URL and read what you can already see (file tree + open file). If a login screen appears, **sign in in that browser tab** and tell the agent to continue. Still do not paste passwords into chat.

This session’s MCP catalog had **no** `cursor-ide-browser` (only `cursor-app-control`), so paste-into-`vendor/base44-prior/` is the reliable path until Browser MCP is enabled.

---

## Other recovery options (only if already available)

These are **not** required. Do not pay for a plan just to export.

- **ZIP export** — Code tab → Export project as ZIP (paid plans). Drop into `imports/base44-export/` if you already have a ZIP.
- **GitHub sync** — App Dashboard → GitHub → private repo (do not overwrite `Nati101/ThriveLife` until we merge on purpose).
- **CLI eject** (owner machine, if the CLI works on the current plan):

```bash
npm install -g base44@latest
base44 eject --app-id 6a74e3c6a18bdd8e70a443ae --path ./thrivelife-base44-export --yes
```

Schemas copy; **data does not**.
- **Workspace invite** — invite Dev to the Base44 app so they can view the editor too.

Env if we later wire `@base44/sdk` (from Base44 docs; no secrets in git):

```bash
VITE_BASE44_APP_ID=6a74e3c6a18bdd8e70a443ae
VITE_BASE44_APP_BASE_URL=https://<your-backend>.base44.app
```

---

## Stack decision (made without the export)

| Choice | Why |
|--------|-----|
| **Vite + React + TypeScript** | Matches Base44’s documented project shape (`vite.config.js`, `src/pages`) |
| Keep monorepo + shared fixtures | Spec domain types stay usable while waiting on real UI |
| Backend / auth | Prefer Base44 SDK + auth **once source lands**; else Postgres + Clerk/Auth.js |

When pasted source arrives: merge pages/components/entities into `apps/web` (or replace the scaffold wholesale if the tree is complete enough).

---

## Runnable today (without Base44 UI)

```bash
cd /Users/nati/Documents/GitHub/ThriveLife
npm install
npm run dev
```

Opens the Vite foundation + fixture content — **not** the client’s Base44 prototype UI.
