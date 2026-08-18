# ThriveLife — Detailed Task List

Actionable build plan derived from **Developer Specification v1.0 (July 2026)**.  
Another developer should be able to execute from this list without re-reading the full spec.

**Related:** [SPEC-SUMMARY.md](./SPEC-SUMMARY.md) · [QUESTIONS.md](./QUESTIONS.md) · [SPEC-COMPLIANCE.md](./SPEC-COMPLIANCE.md) · [Full plaintext spec](./ThriveLife-Developer-Specification-v1.txt)

**Legend:** `- [ ]` = todo · `- [x]` = done · Owner hints: **Dev**, **Joel**, **Legal**, **Design**

### Status 2026-08-18 (V1 web beta, fixture content)

Dev-owned product phases **0–9** are implemented in the Vite app with unit/API/Playwright tests. Persistence is **local JSON** plus **optional dual-write** to Canada Central Supabase (`bpbfezmierdtproczkpj`) via `session_mirrors` when a service role key is present. Honest leftovers: Joel copy, Legal/PIPA sign-off, production email keys, formal WCAG audit, Phase 10 expert/pilot work. Details: [SPEC-COMPLIANCE.md](./SPEC-COMPLIANCE.md).

---

## Phase 0 — Project foundation (Dev)

Scaffolding and tooling. **Locked:** web-first client; solo private GitHub repo (org transfer later); **same app with roles** for editors/reviewers; **local JSON content store** (not Supabase; Postgres later when sessions/beta need it — not a Phase 0/2 blocker). See [QUESTIONS.md](./QUESTIONS.md) Decisions locked.

### 0.1 Repository & engineering hygiene
- [x] Create private GitHub repo under solo Dev account (`Nati101/ThriveLife`)
- [ ] Enable branch protection on `main` (PR required when collaborators join)
- [ ] Add CONTRIBUTING notes when collaboration starts
- [x] PR template present (`.github/pull_request_template.md`)
- [x] Choose and document monorepo vs multi-repo layout (placeholders under `apps/`, `services/`, `packages/` exist)
- [x] Set up CI (lint, typecheck, unit tests) on PR
- [ ] Set up environments: `local` / `staging` / `production`
- [x] Secrets management (no secrets in git); `.env.example` only
- [x] Logging, error tracking (e.g. Sentry), and feature-flag strategy (optional for V1)
- [ ] **Future: transfer repo to a GitHub organization** (Settings → Transfer ownership, or org import); update remotes, secrets, CI, and access; keep repo **private** unless cleared

### 0.2 Stack & platform decisions
- [x] Primary client: **web app** (native mobile deferred)
- [x] Choose web framework → **Vite + React + TypeScript + Tailwind + React Router** (aligned with Base44; Next.js scaffold replaced)
- [x] Decide backend → **Vite `/api` middleware** (JSON local + optional Supabase overlay)
- [x] Decide database → **Supabase Postgres in Canada Central (`ca-central-1`)**; local JSON remains the `npm run dev` runtime
- [x] Decide auth provider → **Supabase Auth** for production path; `/dev/role` stub in DEV only
- [x] Decide hosting region → **Prefer Canada region**; Legal confirm before beta
- [x] Admin UI approach: **same web app, role-gated routes** (not a separate admin app)
- [x] Define role matrix: `user` | `editor` | `reviewer` | `admin` — draft in `@thrivelife/shared`
- [ ] **Base44 prior app:** paste editor source into `vendor/base44-prior/` (free plan; no paid export) ([BASE44-PRIOR-APP.md](./BASE44-PRIOR-APP.md)) — **blocker for real UI**
- [ ] After paste: merge Base44 pages/components/entities into `apps/web` (or adopt that tree as source of truth)

### 0.3 Initial app shell (no product logic yet)
- [x] Bootstrap **web** app with routing skeleton (member flows + role-gated content/admin routes)
- [x] Health probe (`apps/web/public/health.json`); content API `/api/health` in Phase 2
- [x] Bootstrap DB migrations tooling (JSON store now; SQL migrations with Postgres)
- [x] Shared types + fixtures in `@thrivelife/shared`
- [x] Role gate helpers (fail closed on `/admin` routes)
- [ ] Design-token placeholders once brand direction exists (see Phase 0.4)

### 0.4 Brand & UX prerequisites (**Joel + Design** — blocks polished UI)
- [ ] Agree interim visual system for internal builds (can be utilitarian)
- [ ] Receive brand/design system before Phase 4 UI polish
- [ ] Tone guide: no shame language, no streak penalties, no red alerts for ordinary fluctuation

### 0.5 Content delivery gate (**Joel** — blocks Phase 3 scoring & Phase 4 recommendations)
- [ ] Receive terminology dictionary
- [ ] Receive chapter-to-app content map
- [ ] Receive seven battery construct definitions + boundaries
- [ ] Receive candidate item bank with construct IDs (DRAIN + Full Assessment + Scan wording)
- [ ] Receive recharge action library (all tiers × batteries, Plan A/B text)
- [ ] Receive result interpretation copy
- [ ] Receive safety / escalation / disclaimer copy
- [ ] Receive notification copy (before Phase 5 reminders)
- [x] **Dev:** seed placeholder/fixture content so engine can be unit-tested before final copy lands

---

## Phase 1 — Content architecture handoff (**Joel**, Dev supports)

Spec §11.1. Developer should **not** ship real scoring/recommendation with invented clinical/wellness wording.

- [x] Define content package format (JSON/CSV/CMS import) jointly
- [x] Import pipeline: batteries → constructs → instruments → items → response scales
- [x] Versioning rules for items (new version invalidates cross-version numeric compare)
- [ ] Content review checklist before enabling in staging
- [ ] Track open risks from spec §13 that depend on content (item wording, recharge library, recharge dimension structure)

---

## Phase 2 — Core data model & admin (Dev) — foundation

Spec §§10–11.2. Everything else depends on this.

**Local stack (2026-08-18):** JSON file store + Vite `/api` middleware for `npm run dev`. **Supabase Postgres** in Canada Central (`bpbfezmierdtproczkpj`) holds the same schema with RLS; fixture seed applied. Member sessions dual-write to `session_mirrors` when `SUPABASE_SERVICE_ROLE_KEY` is set.

### 2.1 Database schema (Section 10)
- [x] `User` — profile, timezone, preferences, consent_status, notification_settings, content_pathway, age_verified, **role** (typed in `@thrivelife/shared` schema; stub session until real auth)
- [x] `Battery` — name, definition, icon, display_order, book_chapter_ref (seed 7 batteries)
- [x] `Construct` — battery_id, dimension (capacity|strain|recharge), subconstruct, definition, book_chapter_ref
- [x] `Instrument` — drain_check | battery_scan | full_assessment | weekly_mode_check
- [x] `Item` — construct_id, instrument_id, timeframe (moment|two_week), wording, response_scale_id, scoring_direction, version, active
- [x] `ResponseScale` — labels JSON, stored_type, min/max — **configurable, not hard-coded**
- [x] `AssessmentSession` — typed in schema for Phase 3 (not persisted yet)
- [x] `AssessmentResponse` — typed in schema for Phase 3 (not persisted yet)
- [x] `BatteryResult` — typed in schema for Phase 3 (not persisted yet)
- [x] `OverchargeFlag` — typed in schema for Phase 3 (not persisted yet)
- [x] `DrivingMode` — typed in schema for Phase 3 (not persisted yet)
- [x] `Signal` — typed in schema for Phase 3 (not persisted yet)
- [x] `RechargeAction` — duration_tier, mode_suitability, Plan A/B, accessibility, health_caution, chapter_source
- [x] `RechargePlan` — typed in schema for Phase 3 (not persisted yet)
- [x] `DailyCheckIn` — typed in schema for Phase 3 (not persisted yet)
- [x] `TuneUp` — typed in schema for Phase 3 (not persisted yet)
- [x] `ScoringThreshold` — **admin-editable**; seed provisional values from §4.3
- [x] `EscalationEvent` — typed in schema for Phase 3 (not persisted yet)
- [x] Indexes for user+date queries, session lookups, stale-after windows (Postgres later)
- [ ] Soft-delete / retention fields as privacy model requires (confirm with Legal) — items soft-deactivate only for now

### 2.2 Domain invariants (enforce in DB + service layer)
- [x] Never average Capacity/Strain/Recharge into one battery score (types keep dimensions separate)
- [x] Unsure / N/A stored as null — never midpoint (documented on `AssessmentResponse`)
- [x] DRAIN Check never writes battery state (Phase 3 engine)
- [x] Battery Scan never overwrites Full Assessment states (Phase 3 engine)
- [x] Daily Check-In and Full Assessment never share a chart axis (data model supports separation)
- [x] Assessment version stamped on every result session (field on `AssessmentSession` / items)

### 2.3 Content editor (same web app, role-gated)
- [x] Role-based access: editors/reviewers/admins reach content tools inside the **same** web app (no separate admin deploy)
- [x] Enforce permissions server-side (editor draft, reviewer can draft/review per matrix, admin thresholds) — cookie stub role on `/api/*`
- [x] CRUD batteries, constructs, instruments, items (with versioning UX) — batteries/instruments seed+list; constructs/items/recharge/scales/thresholds mutate
- [x] When editing a construct, surface **all timeframe variants** together
- [x] CRUD response scales and labels
- [x] CRUD scoring thresholds (with audit log of changes) — restrict to appropriate roles
- [x] CRUD recharge actions (signals / recommendation lookup rows deferred to Phase 4)
- [x] CRUD result interpretation / safety / notification copy
- [ ] Preview mode for instruments
- [x] Activate/deactivate items without deleting historical responses
- [x] Acceptance: Joel (and other editors/reviewers) can change thresholds and copy **without a code release** (local JSON store; Postgres later)

### 2.4 Seed & fixtures
- [x] Seed seven batteries + provisional thresholds (§4.3, §4.4 matrix as code rules reading config)
- [x] Fixture instruments/items for automated tests
- [ ] Migration rollback tested (JSON reset endpoint only; SQL migrations TBD)

### 2.5 Phase 2 tests
- [ ] Schema migration tests
- [x] Admin permission tests
- [x] Threshold read path used by scoring service (no magic numbers in scorer) — Phase 3

**Remaining Phase 2 gaps:** instrument preview UI; automated RLS tests against live Postgres (policies exist; local API tests cover cookie RBAC); dual-write of member sessions. **Supabase is live** in `ca-central-1`.

---

## Phase 3 — Assessment engine (Dev)

Spec §§3–6, §11.3. Prefer waiting for Joel’s item bank; use fixtures until then.

### 3.1 Shared assessment session framework
- [x] Start/resume/complete session API
- [x] Persist per-item responses with timestamps
- [x] Support skip / N/A / Unsure
- [x] Abandonment detection hooks (dwell time → Phase 8)
- [x] Interval calculation since previous Full Assessment

### 3.2 DRAIN Check (~10 items, Yes/Somewhat/No → 2/1/0)
- [x] Instrument UI + API
- [x] Session-only intervention trigger wiring (does **not** update battery states)
- [x] Maps to recommendation priority 1 when completed this session (§8.1)

### 3.3 Battery Scan (7 + 1 follow-up)
- [x] Rate each battery Low / Steady / Full / Unsure
- [x] Unsure → one disambiguating follow-up (“closer to Low or Steady?”); else missing
- [x] Writes “today’s recommended battery” authority (stale after 18 hours)
- [x] Does not overwrite Full Assessment states

### 3.4 Full Assessment (56 items: 8×7 — Capacity×3, Strain×3, Recharge×2)
- [x] 0–4 frequency + N/A; show number + word label
- [x] Instructions: past two weeks recall window
- [x] Hard floor: block re-admin &lt; 14 days with prescribed copy (§7.3)
- [x] Store `interval_days` / `interval_since_previous`
- [x] Scoring (§4):
  - [x] Mean of completed items per dimension
  - [x] Dimension score only if ≥2 of 3 (or 2 of 2 Recharge); else `insufficient_data`
  - [x] Battery state only if all three dimensions available
  - [x] Partial dashboard if ≥5 of 7 batteries have states; name incomplete batteries
  - [x] Track N/A item IDs per session for pilot (`naItemIds`; aggregate &gt;15% rewrite flag not built yet)
- [x] Apply **ScoringThreshold** config → Low/Moderate/Strong (Capacity, Recharge) and Low/Rising/Elevated (Strain)
- [x] Apply **Battery State Matrix** (§4.4) → Well Charged | Steady | Strained but Functioning | Low
- [x] Persist `BatteryResult` rows + assessment version

### 3.5 Overcharge flag (§5)
- [x] Compute after all seven states resolved
- [x] Conditions 1–4 from config where possible (thresholds admin-editable)
- [x] Store contributing batteries list
- [x] Messaging constraints (approved pattern; banned words)
- [x] Dismissible; do not re-raise until next Full Assessment
- [x] Not a red alert; observation + reflection + starting battery from depleted set

### 3.6 Driving Mode (§6)
- [x] Weekly Mode Check instrument (Green/Yellow/Red/Unsure)
- [x] User-declared mode is authoritative (stale after 7 days)
- [x] Compute **suggested** mode via signal-count rule (advisory only — never silent write)
  - [x] Battery “showing signal” = ≥2 of 3 Strain items ≥ 3
  - [x] 0–1 → Green, 2–3 → Yellow, 4+ → Red
- [x] Log full signal-count distribution for pilot recalibration
- [x] Mode effects: duration ceilings and Plan A/B behavior (§6.3) — deferred to Phase 4 recommendation engine

### 3.7 Authority & staleness service (§3.2)
- [x] Central resolver: for each dashboard element, return value | stale | missing + prompt
- [x] Unit tests proving no cross-instrument writes

### 3.8 Phase 3 tests (critical)
- [x] Table-driven tests for battery state matrix (all rows in §4.4)
- [x] Missing-data / insufficient_data cases
- [x] Overcharge true/false edge cases (esp. healthy high engagement vs condition 4)
- [x] Suggested mode signal-count boundaries
- [x] 14-day Full Assessment lockout
- [x] Version stamp + no cross-version numeric compare helpers

**Phase 3 remaining gaps (honest):**
- Scores are real engine math on **fixture** constructs, not Joel-authored items.
- Aggregate N/A&gt;15% **pilot dashboard** is not built (per-session flag exists).
- Local sessions persist to `sessions.json`; dual-write to `public.session_mirrors` when service role env is set.
- Difficulty-stopping overcharge item is fixture-id keyed (`fixture_full_work_daily_purpose_strain_3`); Joel content must preserve a tagged item or admin config override.

---

## Phase 4 — Dashboard & recommendations (Dev + Design)

Spec §§3.5, 8, 11.4. Needs recharge library + result copy from Joel; design system for polish.

### 4.1 Dashboard five elements (§8)
- [x] Most depleted battery (lowest Capacity + highest Strain + lowest Recharge)
- [x] Most stabilizing starting point (Physical or Daily Rhythms if severely low; else lowest; user override)
- [x] Strongest support (stable capacity + effective recharge)
- [x] Overcharge risk display (§5.3)
- [x] Today’s recharge — **one action only**, matched to focus battery + mode

### 4.2 Conflict display rule (§3.5)
- [x] Battery ring = Full Assessment state
- [x] Marker = today’s Scan
- [x] If diverge by &gt;1 level, show explicit copy naming both
- [x] Never merge/average Scan + Full Assessment

### 4.3 Recommendation engine (§8.1–8.2)
- [x] Input priority: DRAIN (session) → Battery Scan (&lt;18h) → Full Assessment (&lt;90d) → prompt Scan
- [x] **Rule-based lookup table** (battery × signal × mode × time → action) — admin-editable, not hard-coded conditionals
- [x] Respect mode duration ceilings (Green 10m / Yellow 5m / Red 2m)
- [x] Always include Plan A and Plan B; Red defaults Plan B; never treat Plan B as lesser
- [x] Factor preferences, health limitations, prior effectiveness when data exists
- [x] Accessibility variations + health cautions on actions

### 4.4 Recharge UX
- [x] 60s / 2 / 5 / 10 minute menus filtered by mode
- [x] Completion experience that encourages leaving the app (product goal)
- [x] Provisional dashboard for Scan-only users (onboarding Step 5)

### 4.5 Progress display constraints (§7.4) — shared with Phase 5
- [x] Full Assessment = discrete snapshots only
- [x] No numeric deltas until SEM validated — state/direction labels only
- [x] Block comparing different item versions numerically

### 4.6 Phase 4 tests
- [x] Priority fallback chain
- [x] Mode ceiling filtering
- [x] Conflict display copy triggers
- [x] Lookup table resolution with admin reordering

---

## Phase 5 — Daily loop (Dev)

Spec §§7.2, 7.5–7.6, 11.5.

### 5.1 Daily Check-In (&lt;30 seconds)
- [x] Q1: mode today (G/Y/R/Unsure)
- [x] Q2: which battery needs most support
- [x] Q3: recharge version (2 / 5 / 10 / Plan B)
- [x] Q4: completion (Yes / Partly / Not today / I changed the plan)
- [x] Optional note: text only in V1 (voice notes deferred); **no NLP / classification**
- [x] Writes continuous progress series (separate from assessments)

### 5.2 Restart Rail (§7.5)
- [x] On miss: “Nothing is lost. Practice the return.”
- [x] Actions: Do 2 minutes now / Use Plan B / Schedule next return
- [x] Track: time to return, successful returns, Plan B usage, 4-of-7 consistency
- [x] Do **not** track: streak loss, failed-day counts, social rankings

### 5.3 Two-chart progress history
- [x] Chart A: Full Assessment snapshots (baseline vs current)
- [x] Chart B: Daily Check-In continuous line
- [x] Never merge on one axis
- [x] Labels only (no unjustified numeric deltas)

### 5.4 One Battery Tune-Up (§7.6)
- [x] Gate: requires completed Full Assessment (clear messaging if missing)
- [x] Setup steps 1–6 (warning light → battery → daily action → support action → interval → win definition)
- [x] Support action options: prepare environment, tell trusted person, visible cue, reduce friction, schedule rest, move phone, prepare food/water, block time
- [x] Review at 30/60/90: prescribed reflection questions; continue/deepen/simplify/switch/maintenance
- [x] Prompt Full Assessment at Tune-Up review points and at 90 days if not retaken

### 5.5 Optional reminders
- [x] Notification preferences (opt-in)
- [ ] Use Joel’s notification copy; tone-safe
- [x] Respect disable-notifications privacy control

### 5.6 Phase 5 tests
- [x] Check-in persistence and timezone/date boundaries
- [x] Restart Rail metrics exclude forbidden streak semantics
- [x] Tune-Up gating and review outcomes schema

---

## Phase 6 — Onboarding (Dev)

Spec §7.1, §11.6. Build **after** Scan, Pit Stop, and Full Assessment work.

- [x] Step 1: Welcome — one-sentence product intro
- [x] Step 2: Explanation — wellness disclaimer, consent, not a diagnosis, batteries rise/fall, low ≠ failure
- [x] Step 3: Context questions (season, transitions, caregiving, health, schedule, energy focus) — **personalization only, never scored**
- [x] Step 4: Battery Scan
- [x] Step 5: Provisional dashboard (one battery + 2-min Pit Stop)
- [x] Step 6: First recharge completion (prove product value)
- [x] Step 7: Full Assessment offer (~9 min); decline allowed
- [x] Step 8: Full dashboard + plan (if assessment taken)
- [x] Decline path: re-prompt Day 3 and Day 7
- [x] Age gate 18+ at signup (also Phase 7)
- [x] **Do not** implement adaptive/partial deep assessment based on Scan (§7.1 DEV NOTE)
- [x] Can ship linear MVP flow first; refine after user testing

---

## Phase 7 — Safety & privacy (Dev + Legal + Joel) — **beta gate**

Spec §9, §11.7. Must be complete before any beta user.

### 7.1 Product posture
- [x] Persistent “not diagnosis / not emergency support” disclaimer (onboarding + help)
- [x] Confirm assessment item bank has **no** self-harm/suicidality/substance/abuse screening items
- [x] Document rationale (wellness tool + always-available support, not unstaffed screener)

### 7.2 Always-available support layer
- [x] Persistent link in help menu + foot of every results screen
- [x] Regional crisis / mental health resources list (Canada/Alberta first — confirm regions)
- [x] Never score-triggered; never conditional; never framed as response to answers

### 7.3 Escalation tiers (copy professionally reviewed before beta)
- [x] Tier 1: ≥4 batteries Low across two consecutive Full Assessments ≥14 days apart → non-alarming card + find support + dismiss; no app block; no repeat within 30 days
- [x] Tier 2: Physical Capacity &lt; 1.5 sustained across two assessments → book-voice medical attention guidance
- [x] Persist `EscalationEvent`; respect dismissal windows
- [ ] College + legal sign-off tracked as release checklist item

### 7.4 Free text
- [x] No automated classification / NLP / keyword risk detection

### 7.5 Age gate
- [x] Self-declared 18+ at signup; block under-18
- [x] No teen account paths in V1

### 7.6 Privacy controls (§9.9)
- [x] Private by default for assessments, scores, mode, journal, completion, support needs, tune-ups, future AI chats
- [x] Export data
- [x] Delete data / delete account
- [x] Disable notifications
- [x] Disable AI features (when AI exists)
- [x] Journal retention control
- [x] Opt-in anonymous usage analytics
- [x] Future team-share controls (stub OK if teams deferred)
- [x] Privacy policy + Terms (Legal) linked in-app
- [ ] Encryption at rest, retention, cross-border storage per Legal counsel
- [ ] Alberta PIPA / PIPEDA review before beta

### 7.7 AI rules (if any AI in V1 — prefer defer)
- [x] Only after rule-based system works
- [ ] Allow-list vs deny-list from §9.8 enforced in prompts/product copy
- [x] AI must not replace rule-based scoring

---

## Phase 8 — Pilot instrumentation (Dev) — **beta gate**

Spec §11.8.

- [x] Per-item response timestamp
- [x] Per-screen dwell time
- [x] Abandonment point capture
- [x] N/A and skip flags aggregated
- [x] Device type
- [x] Assessment version
- [x] Interval since previous administration
- [x] Signal-count distribution logging (mode suggestion fragility)
- [x] Threshold change audit + ability to recalibrate without deploy
- [x] Privacy-respecting analytics consent
- [ ] Internal dashboard or export for Joel’s Stage 1 analysis (N≈50–150)

---

## Phase 9 — Auth, accounts & DevOps polish

Scattered across MVP but needed for real users.

- [x] Sign up / sign in / sign out / password reset or magic link
- [x] Assign and change roles (member / editor / reviewer / admin) without a separate app
- [x] Consent capture + versioned consent records
- [x] Timezone handling for daily/weekly prompts
- [x] Email and/or web-push notification infrastructure (optional reminders; native push N/A for web-first)
- [ ] Staging data hygiene (no real PII in shared staging without controls)
- [ ] Backup/restore runbooks
- [x] Rate limiting / abuse basics
- [ ] Accessibility pass (WCAG-oriented; recharge accessibility_variations)
- [ ] Web launch / hosting checklist (custom domain, HTTPS, staging URL)
- [ ] Monitoring & on-call basics for beta
- [ ] When ready: **transfer GitHub repo to organization** and rotate deploy secrets / access

---

## Phase 10 — Validation & launch readiness (**Joel**-led, Dev supports)

From Part 14 — not “features” but release blockers for public launch.

- [ ] Expert content-validity review (3 independent experts) after Phase 3
- [ ] Cognitive interviews (10–15) after Phase 3
- [ ] Stage 1 pilot + threshold recalibration before public launch
- [ ] Escalation protocol professional review complete
- [ ] Privacy/legal documents live
- [ ] No unvalidated psychometric claims in marketing copy
- [ ] Confirm deferred features remain out of product and marketing

---

## Cross-cutting quality bar (all phases)

- [ ] Copy review against central reframe (capacity, not discipline/shame)
- [x] Unit + integration tests for scoring and authority boundaries
- [x] Snapshot/UI tests for critical flows (Full Assessment, dashboard, admin 403)
- [ ] Load/perf smoke for Full Assessment session (56 items)
- [ ] Security review before beta (authz on content roles + user data isolation)
- [x] Keep all numeric thresholds in `ScoringThreshold` / config — grep CI to forbid hard-coded bounds in scorer

---

## Suggested execution order for a solo developer

1. Phase 0 shell + roles middleware (stack/persistence locked: Vite + JSON store)  
2. Phase 2 content model + role-gated tools + fixtures (Postgres deferred)  
3. Phase 3 engine with fixtures (parallel Joel content)  
4. Phase 4 dashboard + lookup recommendations (needs recharge library)  
5. Phase 5 daily loop  
6. Phase 6 onboarding wired to real flows  
7. Phase 7 + 8 before any beta invite  
8. Phase 9 hardening throughout; org transfer when ownership model is ready  
9. Phase 10 validation with Joel  

**Overlap allowed:** Phases 2–5. **Hard gates:** Joel content before real scoring/recs; Safety + telemetry before beta.
