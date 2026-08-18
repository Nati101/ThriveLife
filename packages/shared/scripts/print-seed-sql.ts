/**
 * Print SQL inserts from shared fixtures (seed cloud or local Postgres).
 * Run: npx tsx packages/shared/scripts/print-seed-sql.ts
 */

import { createSeedContentDocument } from "../src/content-store.ts";

function lit(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

const doc = createSeedContentDocument();

const statements: string[] = [];

for (const b of doc.batteries) {
  statements.push(
    `insert into public.batteries (id, name, covers, think_of_it_as, icon, display_order, book_chapter_ref, is_fixture) values (${lit(b.id)}, ${lit(b.name)}, ${lit(b.covers)}, ${lit(b.thinkOfItAs)}, ${lit(b.icon)}, ${b.displayOrder}, ${lit(b.bookChapterRef)}, ${lit(b.isFixture ?? true)}) on conflict (id) do nothing;`,
  );
}
for (const i of doc.instruments) {
  statements.push(
    `insert into public.instruments (id, name, description, timeframe, approximate_item_count, completion_seconds_hint, dashboard_authority) values (${lit(i.id)}, ${lit(i.name)}, ${lit(i.description)}, ${lit(i.timeframe)}, ${i.approximateItemCount}, ${lit(i.completionSecondsHint)}, ${lit(i.dashboardAuthority)}) on conflict (id) do nothing;`,
  );
}
for (const s of doc.responseScales) {
  statements.push(
    `insert into public.response_scales (id, name, labels, stored_type, min_value, max_value) values (${lit(s.id)}, ${lit(s.name)}, ${lit(s.labels)}, ${lit(s.storedType)}, ${lit(s.minValue)}, ${lit(s.maxValue)}) on conflict (id) do nothing;`,
  );
}
for (const c of doc.constructs) {
  statements.push(
    `insert into public.constructs (id, battery_id, dimension, subconstruct, definition, book_chapter_ref, workflow_status, is_fixture) values (${lit(c.id)}, ${lit(c.batteryId)}, ${lit(c.dimension)}, ${lit(c.subconstruct)}, ${lit(c.definition)}, ${lit(c.bookChapterRef)}, ${lit(c.workflowStatus ?? "published")}, ${lit(c.isFixture)}) on conflict (id) do nothing;`,
  );
}
for (const item of doc.items) {
  statements.push(
    `insert into public.items (id, construct_id, instrument_id, battery_id, timeframe, wording, response_scale_id, scoring_direction, version, active, workflow_status, is_fixture) values (${lit(item.id)}, ${lit(item.constructId)}, ${lit(item.instrumentId)}, ${lit(item.batteryId)}, ${lit(item.timeframe)}, ${lit(item.wording)}, ${lit(item.responseScaleId)}, ${lit(item.scoringDirection)}, ${item.version}, ${lit(item.active)}, ${lit(item.workflowStatus ?? "published")}, ${lit(item.isFixture)}) on conflict (id) do nothing;`,
  );
}
for (const s of doc.signals) {
  statements.push(
    `insert into public.signals (id, battery_id, channel, description, severity, related_recharge_ids) values (${lit(s.id)}, ${lit(s.batteryId)}, ${lit(s.channel)}, ${lit(s.description)}, ${lit(s.severity)}, ${lit(s.relatedRechargeIds)}) on conflict (id) do nothing;`,
  );
}
for (const a of doc.rechargeActions) {
  statements.push(
    `insert into public.recharge_actions (id, battery_id, signal_id, duration_tier, mode_suitability, instructions, plan_a_text, plan_b_text, accessibility_variations, health_caution, chapter_source, workflow_status, is_fixture) values (${lit(a.id)}, ${lit(a.batteryId)}, ${lit(a.signalId)}, ${lit(a.durationTier)}, ${lit(a.modeSuitability)}, ${lit(a.instructions)}, ${lit(a.planAText)}, ${lit(a.planBText)}, ${lit(a.accessibilityVariations)}, ${lit(a.healthCaution)}, ${lit(a.chapterSource)}, ${lit(a.workflowStatus ?? "published")}, ${lit(a.isFixture)}) on conflict (id) do nothing;`,
  );
}
for (const t of doc.scoringThresholds) {
  statements.push(
    `insert into public.scoring_thresholds (id, dimension, level_name, min_value, max_value, description, is_provisional) values (${lit(t.id)}, ${lit(t.dimension)}, ${lit(t.levelName)}, ${lit(t.minValue)}, ${lit(t.maxValue)}, ${lit(t.description)}, ${lit(t.isProvisional)}) on conflict (id) do nothing;`,
  );
}
for (const c of doc.contentCopy) {
  statements.push(
    `insert into public.content_copy (id, kind, key, title, body, workflow_status, is_fixture) values (${lit(c.id)}, ${lit(c.kind)}, ${lit(c.key)}, ${lit(c.title)}, ${lit(c.body)}, ${lit(c.workflowStatus)}, ${lit(c.isFixture)}) on conflict (id) do nothing;`,
  );
}
for (const l of doc.recommendationLookups) {
  statements.push(
    `insert into public.recommendation_lookups (id, battery_id, signal_id, mode, duration_tier, time_of_day, recharge_action_id, sort_order, workflow_status, is_fixture) values (${lit(l.id)}, ${lit(l.batteryId)}, ${lit(l.signalId)}, ${lit(l.mode)}, ${lit(l.durationTier)}, ${lit(l.timeOfDay)}, ${lit(l.rechargeActionId)}, ${l.sortOrder}, ${lit(l.workflowStatus)}, ${lit(l.isFixture)}) on conflict (id) do nothing;`,
  );
}

process.stdout.write(statements.join("\n"));
