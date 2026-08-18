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
