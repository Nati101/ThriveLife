# ThriveLife — Phase 0 & 2 spec audit

**Date:** 2026-08-14  
**Against:** Developer Specification v1.0 (July 2026), Parts 10–11.2 + locked decisions in [QUESTIONS.md](./QUESTIONS.md)  
**Visual:** [phase-0-2-audit.canvas.tsx](./phase-0-2-audit.canvas.tsx) (repo copy; also openable as a Cursor canvas beside chat)

## Verdict

**Partial.** The Vite shell, role matrix, JSON content store, and role-gated admin CRUD are a real local foundation. Phase 2 is not done against §11.2: Joel still cannot edit result/safety/notification copy, publish through review, or keep DRAIN wording coordinated with Strain constructs. JSON instead of Postgres is a **Pass** (user-locked, not a fail). Phases 3–10 were not graded as missing.

Live `http://127.0.0.1:3000` was not up during this audit. `/api/health` and RBAC were graded from code. `apps/web/data/content-store.json` contains one threshold audit row (`audit_mst9okt6`, admin, 2026-08-14).

## Counts (in-scope rows)

| Grade | Phase 0 | Phase 2 | Total |
|-------|---------|---------|-------|
| Pass | 16 | 10 | 26 |
| Partial | 1 | 8 | 9 |
| Fail | 3 | 7 | 10 |
| N/A | 3 | (runtime entities / later phases) | — |

## Top 5 gaps

1. **No draft → approve → publish.** `canReviewContent` / `canPublishContent` are display-only. Editors mutate live JSON.
2. **No result / safety / notification copy CRUD.** Explicit in spec §11.2; no entity in `ContentDocument`.
3. **DRAIN items are not Strain timeframe variants** (§3.3). All ten sit on `construct_drain_signal` (`dimension: "drain"`).
4. **Section 10 holes:** `Battery.icon` missing; batteries/instruments `POST` 405; `Signal` typed but not stored; `User` stub-only.
5. **No tests or CI.** Member pages (`DashboardPage`, assessments) import `FIXTURE_*` — admin edits never appear there. Dashboard hardcodes fixture battery states (pretend Phase 4).

## What already holds

- Same web app, fail-closed `/admin` + cookie RBAC on `/api/content/*`.
- Seven batteries, four instruments, 74 fixture items, nine §4.3 threshold rows (admin-editable, audited).
- Item version bump on wording change; soft-deactivate (no hard delete).
- Construct admin surfaces moment + two-week variants together.
- Types keep Capacity / Strain / Recharge separate; Unsure/N/A documented as null.
- `vendor/base44-prior` is chrome reference only — not the spec product. Paste still incomplete.

## Next (Phase 3)

Wire instruments to the store (not fixture imports); persist sessions/responses; scorer **must** read `ScoringThreshold` rows; enforce §3.2 authority (DRAIN never writes battery state; Scan never overwrites Full Assessment). Re-link DRAIN to Strain constructs before treating scores as real. Wait on Joel’s item bank for shipping wording.
