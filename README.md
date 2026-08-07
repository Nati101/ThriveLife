# ThriveLife

Real-time **capacity-navigation** app based on *Live Recharged* by Joel Pukalo.

Helps adults notice low energy, identify which Life Battery is most depleted, and take the smallest effective recharge action — without shame, streaks, or clinical diagnosis.

> **Core promise:** Understand what is draining you and take the next right step to recharge.

## Status

Early scaffolding and planning. No product implementation yet.

**Repo:** https://github.com/Nati101/ThriveLife (private, solo Dev account). Plan to **transfer into a GitHub organization** later — see [docs/TASKS.md](docs/TASKS.md) Phase 0.1.

| Document | Purpose |
|----------|---------|
| [docs/SPEC-SUMMARY.md](docs/SPEC-SUMMARY.md) | Concise product & architecture summary |
| [docs/TASKS.md](docs/TASKS.md) | Phased, actionable build checklist |
| [docs/QUESTIONS.md](docs/QUESTIONS.md) | Clarifying questions & open risks |
| [docs/ThriveLife-Developer-Specification-v1.txt](docs/ThriveLife-Developer-Specification-v1.txt) | Full developer spec (plaintext) |

Original Word spec (local): `/Users/nati/Downloads/ThriveLife-Developer-Specification-v1.docx`  
Version: Developer Specification **v1.0 · July 2026** (confidential)

## Decisions locked

- **Web app** for V1 (native mobile deferred)
- **Same app with roles** for content editors/reviewers (not a separate admin app)
- Solo private GitHub ownership now → org migration later

Framework/backend/auth/hosting still open — [docs/QUESTIONS.md](docs/QUESTIONS.md).

## Planned shape

```
ThriveLife/
├── docs/                 # Spec, tasks, questions
├── apps/                 # Web app (member + role-gated content routes)
├── services/             # API / workers — TBD with stack
├── packages/             # Shared types, scoring config — TBD
└── admin/                # Deprecated placeholder — content tools live in-app via roles
```

Implementation starts after remaining Phase 0 stack choices.

## Domain snapshot

- **7 Life Batteries** × **3 dimensions** (Capacity, Strain, Recharge Skill) — never averaged
- **4 instruments:** DRAIN Check, Battery Scan, Full Assessment (56 items), Weekly Mode Check
- **Driving Modes:** Green / Yellow / Red (user-declared)
- **Recharge:** 60s / 2 / 5 / 10 min with Plan A / Plan B
- **Admin-editable** scoring thresholds and recommendation lookup tables

## Build phases (high level)

0. Foundation & stack decisions  
1. Content architecture (Joel)  
2. Data model & admin  
3. Assessment engine  
4. Dashboard & recommendations  
5. Daily loop  
6. Onboarding  
7. Safety & privacy *(beta gate)*  
8. Pilot telemetry *(beta gate)*  

Details: [docs/TASKS.md](docs/TASKS.md)

## Out of scope for V1

Team features, teen accounts, subscriptions, gamification, AI emotional analysis, faith-based pathway, workplace reporting — see spec §11.9.

## Confidentiality

This repository may contain product specification material marked **CONFIDENTIAL — NOT FOR DISTRIBUTION**. Keep the remote **private** unless explicitly cleared for public release.
