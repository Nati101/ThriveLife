# ThriveLife — Clarifying Questions

Questions, ambiguities, and risks derived from Developer Specification v1.0 (July 2026).  
**Prioritized so blockers for development appear first.**

**Related:** [SPEC-SUMMARY.md](./SPEC-SUMMARY.md) · [TASKS.md](./TASKS.md)

---

## Decisions locked (no longer blockers)

| # | Decision | Answer | Date |
|---|----------|--------|------|
| D1 | Primary client for V1 | **Web app** (not native mobile as primary target) | 2026-08-07 |
| D2 | GitHub / ownership | **Solo developer account** for now; **migrate repo into an organization later** | 2026-08-07 |
| D3 | Admin / editors | **Same web app with roles** (e.g. user, editor, reviewer, admin) — not a separate admin app | 2026-08-07 |
| D4 | Web framework | **Next.js App Router + TypeScript + Tailwind** (`apps/web`) | 2026-08-07 |
| D5 | Monorepo | **npm workspaces** — `apps/web`, `packages/shared`, `services/` reserved | 2026-08-07 |
| D6 | Backend | **Next.js full-stack** for V1; Postgres in Phase 2 | 2026-08-07 |
| D7 | Auth provider | **Clerk** planned (local stub until Phase 9); Auth.js documented fallback | 2026-08-07 |
| D8 | Hosting region | **Prefer Canada** for assessment data; Legal confirm before beta | 2026-08-07 |

Repo today: private under personal account [`Nati101/ThriveLife`](https://github.com/Nati101/ThriveLife). Org transfer is tracked in [TASKS.md](./TASKS.md) Phase 0.1.

### Stack tension — Base44 (Vite) prior app vs Next scaffold

A prior client exists in **Base44** (editor path shows `vite.config.js` → React/Vite). This repo’s scaffold is **Next.js**. **Do not rewrite or tear down Next until the Base44 export is in hand.** Then either (a) continue from the Vite export as source of truth, or (b) port UI/logic into the current Next scaffold. Export steps and local-search results: [BASE44-PRIOR-APP.md](./BASE44-PRIOR-APP.md).

---

## P0 — Blocks starting implementation

### Platform & architecture
1. ~~**What is the primary client for V1?**~~ → **Decided: web app** (see D1).
2. ~~**What backend/database/hosting stack should we use?**~~ → **Decided: Next.js full-stack + Postgres; prefer Canada hosting** (see D4–D6, D8). Cloud billing owner still TBD.
3. ~~**Who owns the GitHub org / cloud accounts?**~~ → **Decided: solo Dev account now; org migration later** (see D2). Apple/Google store accounts N/A for web-first V1; cloud billing owner still TBD.
4. ~~**Auth method?**~~ → **Decided: Clerk** for Phase 9 (see D7). Exact sign-in methods (email/OAuth) and any SSO still TBD for pilot.
5. ~~**Admin editor audience / same app vs separate?**~~ → **Decided: same app with roles** supporting editors/reviewers (see D3). Exact role matrix drafted in code; finalize with Joel before beta.

### Content gate (spec §11.1 / Part 14)
6. **When will the content package be delivered** (terminology, constructs, 56+ items, DRAIN items, recharge library, result/safety/notification copy)? Scoring and recommendation logic should not ship on invented wording.
7. **Interim approach OK?** May Dev proceed with schema + fixture/placeholder items for automated tests while waiting on manuscript extraction?
8. **Recharge dimension structure (§13 risk #7):** Will Recharge stay as 7×2 items per battery, or move to a cross-battery structure? This can change the schema — decide before locking migrations.

### Legal / compliance (blocks beta, shapes data model early)
9. **Privacy counsel timeline** for Alberta PIPA / PIPEDA: retention periods, encryption, cross-border storage, subprocessors?
10. **Who drafts Privacy Policy & Terms**, and what jurisdictions (Canada-only pilot vs broader)?
11. **Hosting region constraint:** Must all assessment data stay in Canada?

---

## P1 — Blocks specific features or correct behavior

### Product / UX decisions missing from spec
12. **Brand & design system (§13 #10):** Who delivers it, and what’s the interim UI standard for internal builds?
13. **“Most depleted battery” formula (§8):** Spec says “lowest Capacity + highest Strain + lowest Recharge — the combined worst reading.” Exact ranking algorithm? Weighted sum? Lexicographic sort? Needs a precise definition for deterministic code.
14. **“Severely low” for stabilizing start (§8):** What numeric/state threshold means Physical or Daily Rhythms are “severely low”?
15. **Divergence “more than one level” (§3.5):** Confirm ordered levels for Scan (Low &lt; Steady &lt; Full) vs Full Assessment states (Low / Steady / Strained but Functioning / Well Charged). How do Scan enums map onto Assessment states for distance calculation?
16. **DRAIN Check → intervention:** What exact UX/recommendation fires when DRAIN Check completes? Spec says priority 1 for recommendations but not the concrete mapping rules.
17. **Context questions (§7.1 Step 3):** Final question list, response types, and where personalization is applied (recommendation filters only?).
18. **Support resources list (§9.3):** Which regions/countries for V1? Static CMS content or external deep links (e.g. 988, local Alberta resources)?
19. **Notifications:** Channels (push/email/SMS), quiet hours, and timezone rules for Daily Check-In / Weekly Mode / Day 3–7 assessment prompts?

### Scoring & instruments
20. **Exact DRAIN Check item count and constructs:** Spec says “~10” — final count and construct IDs?
21. **Battery Scan follow-up:** Only for Unsure, and only “Low or Steady”? What if user meant Full vs Steady?
22. **Suggested mode when Full Assessment missing/stale:** Still compute from last assessment? Hide suggestion? Prompt assessment first?
23. **Weekly Mode Check “Unsure”:** Does Unsure leave previous declared mode in place, clear mode, or force a choice before recommendations?
24. **Overcharge condition 4:** Exact Work strain item(s) about “difficulty stopping” — IDs once item bank exists; keep as config references?
25. **Partial dashboard (&lt;5 batteries):** Exact UX — which elements hide vs show with caveats?

### Safety
26. **Escalation Tier 1/2 copy:** Final signed-off wording before coding strings? College/legal reviewers named?
27. **Dismissed escalation / overcharge:** Any analytics or admin visibility into dismissals?
28. **Age verification:** Self-declare only, or any stronger check for store compliance?

---

## P2 — Ambiguities / contradictions to resolve

29. **Driving Mode dual write paths:** Weekly Mode Check is authoritative, but Daily Check-In Q1 also asks “What mode are you in today?” Does daily answer update `DrivingMode`, only affect that day’s recommendation, or both?
30. **Stale Driving Mode (7 days) vs daily mode question:** If weekly declaration is stale, does daily check-in satisfy authority for “today’s recharge”?
31. **Plan B in Daily Check-In Q3** is listed alongside 2/5/10 min — is Plan B a duration alternative or a parallel dimension (user can pick 5 min Plan B)?
32. **MVP checklist vs deferred:** “Voice notes” deferred, but Daily Check-In mentions “short text or voice note.” Confirm V1 = text only.
33. **“Optional reminders”** listed under Required for V1 in §11.9 formatting — confirm reminders are in MVP.
34. **Subscriptions deferred** but long-term monetization unknown — any pilot access control (invite codes) needed?
35. **Content pathway on User** includes future Christian pathway — store enum now with only `default`, or omit until needed?
36. **Original App Plan conflicts (§12):** Confirm no stakeholder still expects assessment-first onboarding or computed (non-declared) Driving Mode.

---

## P3 — Missing non-functional requirements

37. **Scale targets:** Concurrent users, pilot size (50–150), expected DAU after launch?
38. **Offline support:** Must Check-In / Scan work offline?
39. **Localization:** English only for V1? Canadian spelling?
40. **Accessibility bar:** WCAG 2.x target? Dynamic type / screen reader requirements?
41. **Performance budgets:** Full Assessment load/time-to-first-question targets?
42. **Data export format:** JSON, CSV, human-readable PDF?
43. **Account deletion SLA:** Immediate hard delete vs soft delete + retention window?
44. **Backup / disaster recovery** RPO/RTO expectations?
45. **Security review:** Required before beta? Penetration test?
46. **Analytics vendor:** First-party only vs Mixpanel/PostHog/etc., and consent UX?

---

## Assumptions made for scaffolding (need confirmation)

| # | Assumption | Impact if wrong |
|---|------------|-----------------|
| A1 | V1 is a **private** GitHub repo under the solo Dev account (**confirmed**); transfer to org later | Schedule org transfer when ready |
| A2 | **Postgres**-style relational DB matches Section 10; thresholds are data not code | Stack choice |
| A3 | Build **one web app** (member + role-gated content tools) + API — not a separate admin app, not no-code | Architecture |
| A4 | Pilot is **invite-only**; native stores deferred (web-first) | Auth, gating, CI/CD |
| A5 | **English (Canada)** only for V1 | i18n architecture |
| A6 | **Text-only** journal in V1 (voice deferred) | Media storage |
| A7 | Reminder notifications are **in MVP** but opt-in | Infra (email/web push) |
| A8 | Dev may scaffold schema and **fixture content** before Joel’s final item bank | Parallelization |
| A9 | No AI features in first beta | Scope |
| A10 | **Web app is primary** for V1 (**confirmed**); native mobile deferred | Schedule / responsive UX |

---

## Spec open risks (from §13) — track as project risks

| # | Risk | Owner | Dev implication |
|---|------|-------|-----------------|
| 1 | Uncalibrated thresholds | Joel | Config-driven only; recalibrate post-pilot |
| 2 | Signal-count → too many Red | Joel | Log distributions; don’t hard-code |
| 3 | Overcharge condition 4 false positives | Joel | Feature-flag / easy threshold edit |
| 4 | Escalation not professionally reviewed | Joel | Block beta until sign-off |
| 5 | Item wording blocked on manuscript | Joel | Blocks real Phase 3 content |
| 6 | Seven-factor structure unverified | Joel | No validation claims in product copy |
| 7 | Recharge may be cross-battery | Joel | Possible schema change |
| 8 | PIPA/PIPEDA unspecified | Joel + Legal | Blocks beta data handling |
| 9 | Recharge library missing | Joel | Blocks Phase 4 engine population |
| 10 | No brand/design system | Joel + Dev | Blocks UI polish |

---

## Questions for Joel (content/product owner) — short list to send

1. Delivery date for item bank + recharge library?  
2. Confirm Daily Check-In mode vs Weekly Mode Check interaction.  
3. Exact algorithm for “most depleted” and Scan↔Assessment level distance.  
4. Design system timeline and interim brand OK?  
5. Pilot geography, hosting region, and legal review schedule?  
6. ~~Preferred app platform?~~ → Web (decided). Confirm pilot users are fine with browser-only.
7. Recharge dimension: per-battery 2 items vs cross-battery?  
8. Final banned/allowed language list beyond §5.3 examples?
9. Role matrix for editor vs reviewer vs admin (who can publish vs draft-only)?
10. Base44 prior app: can you export ZIP / connect GitHub / invite Dev? Prefer Vite-as-source or port into Next? (see [BASE44-PRIOR-APP.md](./BASE44-PRIOR-APP.md))
