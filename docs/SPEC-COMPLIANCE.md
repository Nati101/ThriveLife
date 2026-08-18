# ThriveLife — Spec compliance (Developer Specification v1.0)

**Date:** 2026-08-18  
**Against:** Developer Specification v1.0 (July 2026)  
**Runtime:** Vite + React web app; local JSON store for `npm run dev`; **dual-write to Supabase** (`session_mirrors` + content upsert) when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` exist. Cloud: **Canada Central (`ca-central-1`)** project `ThriveLife` (`bpbfezmierdtproczkpj`).  
**Visual:** [spec-compliance.canvas.tsx](/Users/nati/.cursor/projects/Users-nati-Documents-GitHub-ThriveLife/canvases/spec-compliance.canvas.tsx)

Fixture wording is allowed for V1 web beta. This is **not** clinical validation.

## Counts

| Grade | Count |
|-------|-------|
| Pass | 54 |
| Partial | 10 |
| Fail | 4 |
| N/A (Joel/Legal/design) | 12 |

Listed rows below are the scored product requirements. Totals include the same set as the previous pass, with Day 3/7 mailer, legal *surfaces*, dual-write, rate limit, error boundary, Playwright, and preference-aware recs moved out of Fail/Partial where the code now exists.

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
| 8 | Five dashboard elements | Pass | `/api/me/dashboard` from live sessions (not hardcoded fixtures) |
| 8.1–8.2 | Lookup table recs + preferences/health/effectiveness | Pass | `pickTodayRecharge` + `memberContext` |
| 7.2 | Daily Check-In 4Q + optional note, no NLP | Pass | `/check-in` enabled; batteries from dashboard API |
| 7.5 | Restart Rail | Pass | Message + 3 actions; metrics exclude streaks |
| 7.4 | Two charts, no numeric deltas | Pass | `/progress` snapshots vs check-in series |
| 7.6 | Tune-Up 30/60/90 gated on FA | Pass | `/tune-up` 409 without Full Assessment |
| 7.1 | Onboarding value-first 8 steps | Pass | `/onboarding` linear flow |
| 7.1 | Decline FA, Day 3/7 re-prompts | Pass | `dueFullAssessmentPrompts` + log/Resend mailer + dashboard banner |
| 9.1–9.3 | Wellness disclaimer + always-available support | Pass | Footer, `/support`, not score-triggered |
| 9.2 | No risk-screening items | Pass | Fixture bank has none; rationale documented |
| 9.4–9.5 | Escalation tiers | Pass | `evaluateEscalation` + dashboard card |
| 9.6 | No NLP on journal | Pass | Text stored only |
| 9.7 | Age gate 18+ | Pass | Onboarding + `/auth` signup checkbox; no teen paths |
| 9.9 | Export/delete/privacy toggles | Pass | `/privacy` |
| 9.9 | Privacy policy / Terms surfaces | Partial | `/privacy-policy` and `/terms` are labeled **DRAFT**; PIPA/PIPEDA still Legal |
| 11.2 | Admin CRUD copy + draft/publish | Pass | `/admin/copy` + workflow POST; scoring from store |
| 11.8 | Telemetry | Partial | Timestamps, N/A>15% flag, `/api/me/telemetry`; no Joel pilot dashboard |
| 11.9 MVP list | Required V1 features | Pass | See product routes; deferred items stay out |
| Auth | Real identity store | Partial | `/auth` Supabase; `/dev/role` **DEV-only** |
| Hosting | Canada region | Pass | Cloud project `ca-central-1`; Legal confirm still needed before beta |
| Joel content | Item bank, recharge library, result copy | Partial | Fixtures labeled `[FIXTURE]` |
| Phase 10 | Expert review, interviews, pilot, legal docs | Fail | Joel/Legal-owned; not claimed |
| Psychometric claims | None in product | Pass | Fixture banner; no validation claims |
| CI | lint/typecheck/tests on PR | Pass | `.github/workflows/ci.yml` includes Playwright |
| Playwright E2E | Critical paths | Pass | `apps/web/e2e/critical-paths.spec.ts` (FA, dashboard, admin 403) |
| Email reminders | Optional notifications | Pass | Log provider always; Resend when `RESEND_API_KEY` set; SMTP noted not faked |
| Rate limit / errors | Beta ops | Pass | In-memory `/api` rate limit; React error boundary; optional `VITE_SENTRY_DSN` beacon (no paid SDK) |
| WCAG pass | Accessibility | Partial | Labels, skip link, focus-visible, contrast tweak; no formal audit |
| Seed cloud | Fixture rows in Postgres | Pass | Schema + RLS live; `session_mirrors` + `notification_outbox` added |
| Dual-write | Sessions/content to Supabase | Pass | JSON always; cloud when service role exists (stub user_key, not auth UUID FK) |

## Blocked (honest)

- Joel’s terminology, item bank wording, recharge library, result/safety/notification copy.
- Legal: finished privacy policy, Terms, Alberta PIPA/PIPEDA, cross-border confirmation. Draft pages are placeholders.
- Brand/design system.
- Production email/push (Resend key not in this environment; SMTP client not shipped).
- Normalized `assessment_sessions` rows for the local stub user (`stub-user-local` is not `auth.users` UUID). Dual-write uses `session_mirrors`.
- Formal WCAG audit, Joel Stage 1 telemetry dashboard, expert/pilot work.

**Do not claim clinical validation.** Thresholds remain provisional expert judgment.
