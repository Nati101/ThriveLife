# Content package format (Phase 1)

Fixture content is labeled `[FIXTURE]` and lives in `packages/shared/src/fixtures/`.
Joel can replace files without a scoring-code change.

## Objects

| Object | File / table | Notes |
|--------|----------------|-------|
| Batteries | `fixtures/batteries.ts` | 7 Life Batteries + `icon` |
| Constructs | `fixtures/items.ts` | Capacity / Strain / Recharge per battery. DRAIN Check items **are Strain constructs** at `timeframe=moment`. |
| Instruments | `fixtures/instruments.ts` | Four instruments |
| Items | `fixtures/items.ts` | Versioned wording; soft-deactivate |
| Response scales | `fixtures/instruments.ts` | Configurable labels |
| Recharge actions | `fixtures/recharge.ts` | Plan A/B, duration, mode suitability |
| Lookups | `fixtures/recharge.ts` | battery × signal × mode × time → action |
| Copy | `fixtures/copy.ts` | result / safety / notification / disclaimer |
| Thresholds | `fixtures/recharge.ts` | §4.3 provisional |

## Versioning

Changing item wording bumps `version`. Numeric comparison across versions is blocked (`canCompareNumericResults`).

## Workflow

`draft` → `in_review` → `published`. Member scoring reads published (+ fixtures ship published).

## Import

Seed: `npx tsx packages/shared/scripts/print-seed-sql.ts` → apply to Postgres.
Admin UI: `/admin/content` and `/admin/copy`.

## Joel access (content owner)

1. Open [Sign in → Content contributor access](https://nati101.github.io/ThriveLife/auth?access=content) (or `/auth?access=content` locally).
2. Enter the invite code (default for this demo: `joel-thrivelife-content`, or whatever is set in `VITE_CONTENT_INVITE_CODE`).
3. You land in **Admin** with draft + publish + thresholds.
4. Edit **Content library** (items, constructs, recharge) and **Copy & lookups**, then publish.

Member demos cannot self-elevate to admin on Pages. Content tools require this invite (or DEV role switcher locally).

Share the invite privately; the default code is also in the Pages JS bundle when not overridden.
