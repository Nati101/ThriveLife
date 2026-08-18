# ThriveLife — Spec compliance (Developer Specification v1.0)

**Date:** 2026-08-18  
**Against:** Developer Specification v1.0 (July 2026)  
**Runtime:** Vite + React web app; local JSON store for `npm run dev`; **Supabase Postgres in Canada Central (`ca-central-1`)** project `ThriveLife` (`bpbfezmierdtproczkpj`).  
**Visual:** [spec-compliance.canvas.tsx](/Users/nati/.cursor/projects/Users-nati-Documents-GitHub-ThriveLife/canvases/spec-compliance.canvas.tsx)

Fixture wording is allowed for V1 web beta. This is **not** clinical validation.

## Counts

| Grade | Count |
|-------|-------|
| Pass | 49 |
| Partial | 13 |
| Fail | 6 |
| N/A (Joel/Legal/design) | 12 |

## Requirement → grade

| ID | Requirement | Grade | Evidence |
|----|-------------|-------|----------|
| 1.2 | Notice / match / respond promise | Pass | Dashboard five elements + one recharge action |
| 1.3 | No shame / streak penalties / red ordinary alerts | Pass | Restart Rail copy; overcharge is observation not alert |
| 2.2 | Seven Life Batteries | Pass | `FIXTURE_BATTERIES` + `public.batteries` |
| 2.3 | Three dimensions never averaged | Pass | Types + scorer keep Capacity/Strain/Recharge separate |
| 2.5–2.7 | Modes, duration hierarchy, Plan A/B | Pass | `DRIVING_MODE_BEHAVIOR`, lookup + Plan B default on Red |
| 3.1 | Four instruments | Pass | DRAIN, Scan, Full Assessment, Weekly Mode Check UIs + API |
| 3.2 | Authority / no blending | Pass | `resolveDashboardAuthority` + write guards + tests |
| 3.3 | DRAIN = Strain moment variants | Pass | Drain items share `construct_*_strain` with two-week siblings |
| 3.4 | Unsure/N/A stored null | Pass | Assessment responses; missing-data 2-of-3 tests |
| 3.5 | Conflict display names both | Pass | “usually reads X. Today you marked it Y.” |
| 4.1–4.4 | Scoring, missing data, thresholds, state matrix | Pass | `assessment-scoring.ts` + table tests |
| 5 | Overcharge flag | Pass | Four conditions from config; dismissible |
| 6 | User-declared mode + advisory suggested | Pass | Weekly Mode Check; never silent write |
| 8 | Five dashboard elements | Pass | `/api/me/dashboard` + `DashboardPage` |
| 8.1–8.2 | Lookup table recs, not hardcoded if/else tree | Pass | `recommendation_lookups` + `pickTodayRecharge` |
| 7.2 | Daily Check-In 4Q + optional note, no NLP | Pass | `/check-in` + `/api/me/check-ins` |
| 7.5 | Restart Rail | Pass | Message + 3 actions; metrics exclude streaks |
| 7.4 | Two charts, no numeric deltas | Pass | `/progress` snapshots vs check-in series |
| 7.6 | Tune-Up 30/60/90 gated on FA | Pass | `/tune-up` 409 without Full Assessment |
| 7.1 | Onboarding value-first 8 steps | Pass | `/onboarding` linear flow |
| 7.1 | Decline FA, Day 3/7 fields | Partial | Decline stored; Day 3/7 timestamps exist, no scheduler/email yet |
| 9.1–9.3 | Wellness disclaimer + always-available support | Pass | Footer, `/support`, not score-triggered |
| 9.2 | No risk-screening items | Pass | Fixture bank has none; rationale documented |
| 9.4–9.5 | Escalation tiers | Pass | `evaluateEscalation` + dashboard card |
| 9.6 | No NLP on journal | Pass | Text stored only |
| 9.7 | Age gate 18+ | Pass | Onboarding + `/auth` signup checkbox; no teen paths |
| 9.9 | Export/delete/privacy toggles | Pass | `/privacy` |
| 9.9 | Privacy policy / Terms / PIPA review | Fail | Legal deliverable — links placeholder |
| 11.2 | Admin CRUD copy + draft/publish | Pass | `/admin/copy` + workflow POST |
| 11.8 | Telemetry | Partial | Timestamps, N/A>15% flag, device helper, `/api/me/telemetry`; no Joel pilot dashboard |
| 11.9 MVP list | Required V1 features | Pass | See product routes; deferred items stay out |
| Auth | Real identity store | Partial | Supabase Auth pages + profiles trigger; local stub `/dev/role` in DEV |
| Hosting | Canada region | Pass | Cloud project `ca-central-1`; Legal confirm still needed before beta |
| Joel content | Item bank, recharge library, result copy | Partial | Fixtures labeled `[FIXTURE]` |
| Phase 10 | Expert review, interviews, pilot, legal docs | Fail | Joel/Legal-owned; not claimed |
| Psychometric claims | None in product | Pass | Fixture banner; no validation claims |
| CI | lint/typecheck/tests on PR | Pass | `.github/workflows/ci.yml` |
| Playwright E2E | Snapshot tests | Partial | Unit/API-contract tests; no Playwright (cost) |
| Email reminders | Optional notifications | Fail | Preference toggle only; no mailer |
| Rate limit / Sentry | Beta ops | Fail | Not built |
| WCAG pass | Accessibility | Partial | Semantic forms; no formal audit |
| Seed cloud | Fixture rows in Postgres | Pass | Schema + RLS live in `ca-central-1`; seeded 7 batteries, 22 constructs, 74 items, 28 recharge actions, 21 lookups |

## Blocked (honest)

- Joel’s terminology, item wording, recharge library, result/safety/notification copy.
- Legal: privacy policy, Terms, Alberta PIPA/PIPEDA, cross-border confirmation.
- Brand/design system.
- Email/web-push infrastructure.
- Dual-write of member sessions to Postgres (local `npm run dev` still uses JSON; cloud tables exist for Auth users).

**Do not claim clinical validation.** Thresholds remain provisional expert judgment.
