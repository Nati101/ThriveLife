# Base44 prior app — handoff & export guide

**Status:** Prior Base44 (Vite) codebase **not recovered locally** as of 2026-08-07.  
**Do not** tear down the working Next.js scaffold until a clean export lands and we choose a migration path.

**Related:** [QUESTIONS.md](./QUESTIONS.md) · [TASKS.md](./TASKS.md) · [README.md](../README.md)

---

## What we know

| Item | Detail |
|------|--------|
| Prior editor URL | [Base44 app editor → `vite.config.js`](https://app.base44.com/apps/6a74e3c6a18bdd8e70a443ae/editor/workspace/code?filePath=vite.config.js) |
| App ID | `6a74e3c6a18bdd8e70a443ae` |
| Implied stack | **React + Vite** (Base44 standard; `vite.config.js` in editor path) |
| Current ThriveLife repo | **Next.js 16 + TypeScript + Tailwind** monorepo (`apps/web`, `packages/shared`) on `main` @ scaffold commit |
| Product context | ThriveLife / *Live Recharged* (Joel Pukalo) — may be the same product as the Base44 prototype |

### Local search (2026-08-07)

Searched Downloads, Desktop, Documents, and home (shallow) for `*base44*`, `*thrivelife*`, `*live*recharged*`, and related zips.

**Found:** spec/NDA docs only (`ThriveLife-Developer-Specification-v1.docx`, contractor NDA).  
**Not found:** Base44 ZIP export, GitHub sync clone, or Vite project matching this app ID.

---

## Stack tension (decision pending export)

| Track | Stack | Role today |
|-------|--------|------------|
| **A — Current repo** | Next.js App Router + TS + Tailwind monorepo | Runnable scaffold; locked decisions D1–D8 in QUESTIONS |
| **B — Prior Base44 app** | React + Vite (+ Base44 SDK / backend) | Source of truth for any UI/logic already built in the editor |

**Recommendation:** Import the prior app when the user exports it. Then choose **one**:

1. **(a) Continue from the Vite export** as the product source of truth (adapt or replace the Next scaffold later), **or**
2. **(b) Port UI/logic into the current Next scaffold** (keep monorepo + RBAC shell; migrate pages/components/entities).

**Do not** rewrite the whole repo or delete the Next scaffold until the export is in hand and the path above is chosen.

---

## How to export source from Base44

Official docs: [Quick start FAQs](https://docs.base44.com/Getting-Started/Quick-start-guide) · [Developer tools](https://docs.base44.com/documentation/building-your-app/developer-tools) · [GitHub integration](https://docs.base44.com/developers/app-code/local-development/github) · [`base44 eject`](https://docs.base44.com/developers/references/cli/commands/eject)

ZIP / GitHub export typically requires a **[Builder plan](https://base44.com/pricing) or higher**.

### Option 1 — Export project as ZIP (simplest for handoff)

1. Sign in at [app.base44.com](https://app.base44.com/) as the **app owner** (or someone with export rights).
2. Open the ThriveLife / Live Recharged app (ID `6a74e3c6a18bdd8e70a443ae`).
3. Click **Code** in the top bar to open the code view.
4. Click **Export project as ZIP** (icon at the top right of the code view).
5. If you see “upgrade required,” upgrade to Builder+ and retry.
6. Save the ZIP and either:
   - Drop it into this workspace (e.g. `imports/base44-export/`), or
   - Send the ZIP / place it in Downloads and tell Dev the filename.

### Option 2 — Connect / export to GitHub

1. In the app editor, click the **GitHub** icon in the top bar.
2. Authorize Base44 and create or link a repository (owner must do the initial connect).
3. Prefer a **separate private repo** (e.g. `ThriveLife-base44-export`) — do **not** overwrite `Nati101/ThriveLife` until we decide path (a) vs (b).
4. Invite the developer as collaborator, or push a mirror and share the URL.
5. Note: sync behavior has evolved (legacy one-way export vs 2-way sync). Follow the in-product panel; see [GitHub docs](https://docs.base44.com/developers/app-code/local-development/github).

### Option 3 — CLI eject (local clone of frontend + schemas)

If you use the Base44 CLI and own the app:

```bash
# Interactive
npx base44 eject
# or non-interactive
npx base44 eject --app-id 6a74e3c6a18bdd8e70a443ae --path ./thrivelife-base44-export --yes
```

**Caveats (from Base44 docs):**

- Eject downloads frontend + entity schemas / backend resources; **database data is not copied** (empty DB on the new project).
- Eject may create a **new** Base44 project copy linked to the local folder; the original app stays unchanged.
- See [eject command](https://docs.base44.com/developers/references/cli/commands/eject).

### Option 4 — Collaborator invite (if export is blocked)

1. App owner: Dashboard → invite Dev to the Base44 workspace/app.
2. Dev can then attempt ZIP/GitHub/CLI with their account, or screen-share / pair for export.
3. Manual copy of files from the Code tab is a last resort (tedious; free-tier workaround only).

### Optional — export entity data separately

Code export ≠ user data. To export collections as CSV: **Data** → select collection → More actions → **Export** (see Base44 mobile/export notes in docs).

---

## What we need from you

Any **one** of:

1. **ZIP** of the project (preferred for a one-shot handoff), or  
2. **GitHub repo URL** with the exported code + collaborator access, or  
3. **Base44 workspace invite** so Dev can export, or  
4. Confirmation that the Base44 app is **not** the intended product baseline (then we keep Next-only).

Also useful: app display name in Base44, whether it was named ThriveLife vs Live Recharged, and Builder-plan status.

---

## After export arrives

1. Unpack under `imports/base44-export/` (gitignored if secrets present) or a sibling private repo.  
2. Inventory: pages, components, entities, functions, `@base44/sdk` usage, auth.  
3. Choose path **(a)** Vite-as-source or **(b)** port into Next — document the choice in QUESTIONS (new decision row).  
4. Only then retire or reshape the unused track; keep the other as archive until cutover is verified.

---

## Runnable today (without Base44)

```bash
cd /Users/nati/Documents/GitHub/ThriveLife
npm install
npm run dev
```

This starts the **Next.js** web app scaffold — not the Base44 Vite prototype.
