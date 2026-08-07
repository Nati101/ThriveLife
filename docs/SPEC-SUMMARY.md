# ThriveLife — Spec Summary

**Source:** ThriveLife Developer Specification v1.0 (July 2026), based on *Live Recharged* by Joel Pukalo  
**Plaintext copy in repo:** [`docs/ThriveLife-Developer-Specification-v1.txt`](./ThriveLife-Developer-Specification-v1.txt)  
**Original path:** `/Users/nati/Downloads/ThriveLife-Developer-Specification-v1.docx`  
**Status:** Confidential — not for distribution

---

## Product vision

ThriveLife is a **real-time capacity-navigation** app. It helps adults notice when energy is low, identify which life area (battery) is most depleted, and take the **smallest effective action** to recharge — without adding shame, streaks, or more pressure.

It is **not** a habit tracker, mood diary, diagnostic tool, motivational platform, crisis screener, or clinical product.

**Core promise:** Understand what is draining you and take the next right step to recharge.  
Every V1 feature must help the user **notice**, **match**, or **respond**.

**Central reframe:** What looks like a motivation/discipline problem may be a **capacity** problem. Low power calls for a pit stop, not greater self-pressure.

---

## Target users (V1)

Adults experiencing ordinary overload, depletion, or burnout risk — parents, caregivers, professionals, business owners, helping professionals, leaders.

**Deferred audiences:** faith-based pathways, teens, workplace teams, coaching.

---

## Domain model (must guide all UI/data)

| Concept | Role |
|--------|------|
| **DRAIN** | Demands exceed capacity; warning light, not character failure |
| **7 Life Batteries** | Daily Rhythms, Physical, Mental, Emotional, Relational, Spiritual, Work & Daily Purpose |
| **3 dimensions/battery** | Capacity, Strain, Recharge Skill — **never averaged** into one number |
| **Driving Modes** | Green / Yellow / Red — user-declared; control recommendation ceilings |
| **Recharge tiers** | 60s / 2 min (default min dose) / 5 min / 10 min |
| **Plan A / Plan B** | Normal-day vs hard-day minimum; Plan B = full success |

---

## Four assessment instruments

| Instrument | Items | Timeframe | Authorship for dashboard |
|------------|-------|-----------|--------------------------|
| DRAIN Check | ~10 | Right now | Immediate intervention only (session) |
| Battery Scan | 7 + follow-up | Right now | Today’s battery + recharge (18h) |
| Full Assessment | 56 (8×7) | Past 2 weeks | Battery states, overcharge, Tune-Up (90d) |
| Weekly Mode Check | 1 | This week | Driving Mode (7d) |

**Hard rule:** One authoritative source per dashboard element. No blending. Stale → show unavailable + prompt, never substitute.

**Construct registry:** Items belong to constructs; timeframe variants stay coordinated in admin.

---

## Key product surfaces (V1)

1. **Onboarding** — value first: Battery Scan → Pit Stop → then offer Full Assessment  
2. **Seven-battery dashboard** — five elements (most depleted, stabilizing start, strongest support, overcharge flag, today’s recharge)  
3. **Recommendation engine** — rule-based lookup table (admin-editable), Plan A/B  
4. **Daily Check-In** — &lt;30s, four questions (+ optional note, no NLP)  
5. **Restart Rail** — miss recovery without streak shame  
6. **One Battery Tune-Up** — 30/60/90 days after Full Assessment  
7. **Safety layer** — always-available support; Tier 1/2 escalation; age gate 18+  
8. **Admin content editor** — constructs, items, thresholds, recharge library, copy  
9. **Pilot telemetry** — for threshold recalibration  

---

## Tech / platform (not specified in spec)

The specification defines **domain architecture and product behavior**, not language, framework, hosting, or client (iOS/Android/web). Stack decisions are open — see [`QUESTIONS.md`](./QUESTIONS.md).

**Implied technical requirements:**

- User accounts, consent, age verification  
- Relational data model (Section 10 objects)  
- Admin-editable config (especially `scoring_thresholds`)  
- Auth + privacy controls (export/delete)  
- Analytics for pilot (item timing, dwell, abandonment)  
- No hard-coded scoring thresholds  

---

## Explicitly out of scope (V1)

Team feed/messaging, voice notes, leader dashboard, gamification/badges, public profiles, peer matching, AI emotional analysis, group mood analytics, subscriptions, workplace reporting, teen accounts, Christian content pathway, book learning modules (deferred list in §11.9).

AI features (tone rewrite, summaries, etc.) only **after** rule-based system works; never for diagnosis/crisis detection.

---

## Non-negotiable engineering constraints

1. Thresholds in admin config — never hard-coded  
2. Do not normalize response scales across instruments  
3. Unsure/N/A → null, never midpoint  
4. Battery Scan vs Full Assessment conflict → **display both**, never merge  
5. Two progress charts: Assessment snapshots ≠ Daily Check-In line  
6. No numeric deltas until SEM known — direction/state labels only  
7. Assessment version stored; no cross-version numeric comparison  
8. No risk-screening items; no NLP risk detection on free text  
9. Content from Joel required before scoring/recommendation logic  
10. Safety (§7) + telemetry (§8) complete before any beta user  

---

## Build sequence (from spec §11)

1. Content architecture (Joel)  
2. Core data model + admin  
3. Assessment engine  
4. Dashboard + recommendations  
5. Daily loop  
6. Onboarding  
7. Safety & privacy  
8. Pilot instrumentation  

Phases 2–5 may overlap; 7 and 8 gate beta.
