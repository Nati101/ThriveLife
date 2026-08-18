/**
 * Five dashboard elements (spec §8) plus conflict copy (§3.5).
 * Rings = Full Assessment; markers = Scan; never merged.
 */

import {
  BATTERY_IDS,
  BATTERY_STATE_LABELS,
  type BatteryId,
  type BatteryState,
} from "./batteries";
import type { BatteryResult } from "./schema";

export type DepletionScore = {
  batteryId: BatteryId;
  score: number;
  capacityScore: number | null;
  strainScore: number | null;
  rechargeScore: number | null;
  batteryState: BatteryState | null;
};

function numericOr(value: number | null, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Higher = more depleted: low capacity + high strain + low recharge. */
export function depletionScore(row: {
  capacityScore: number | null;
  strainScore: number | null;
  rechargeScore: number | null;
}): number {
  const capacity = numericOr(row.capacityScore, 2);
  const strain = numericOr(row.strainScore, 2);
  const recharge = numericOr(row.rechargeScore, 2);
  return -capacity + strain - recharge;
}

export function rankDepletedBatteries(results: BatteryResult[]): DepletionScore[] {
  const byId = new Map(results.map((row) => [row.batteryId, row]));
  return BATTERY_IDS.map((batteryId) => {
    const row = byId.get(batteryId);
    return {
      batteryId,
      score: row
        ? depletionScore(row)
        : depletionScore({
            capacityScore: null,
            strainScore: null,
            rechargeScore: null,
          }),
      capacityScore: row?.capacityScore ?? null,
      strainScore: row?.strainScore ?? null,
      rechargeScore: row?.rechargeScore ?? null,
      batteryState: row?.batteryState ?? null,
    };
  }).sort((a, b) => b.score - a.score);
}

export function mostDepletedBattery(results: BatteryResult[]): BatteryId | null {
  if (results.length === 0) return null;
  return rankDepletedBatteries(results)[0]?.batteryId ?? null;
}

const STABILIZING_PRIORITY: BatteryId[] = ["physical", "daily_rhythms"];

export function mostStabilizingStartingPoint(
  results: BatteryResult[],
  userOverride?: BatteryId | null,
): BatteryId | null {
  if (userOverride) return userOverride;
  const ranked = rankDepletedBatteries(results);
  const severelyLow = STABILIZING_PRIORITY.find((id) => {
    const row = ranked.find((r) => r.batteryId === id);
    return row?.batteryState === "low";
  });
  if (severelyLow) return severelyLow;
  return ranked[0]?.batteryId ?? null;
}

export function strongestSupportBattery(results: BatteryResult[]): BatteryId | null {
  const scored = results
    .filter(
      (row) =>
        row.capacityScore != null &&
        row.rechargeScore != null &&
        row.batteryState !== "low",
    )
    .map((row) => ({
      batteryId: row.batteryId,
      support: numericOr(row.capacityScore, 0) + numericOr(row.rechargeScore, 0),
    }))
    .sort((a, b) => b.support - a.support);
  return scored[0]?.batteryId ?? null;
}

const RING_LEVEL: Record<BatteryState, number> = {
  low: 0,
  strained_but_functioning: 1,
  steady: 2,
  well_charged: 3,
};

const SCAN_LEVEL: Record<"low" | "steady" | "full", number> = {
  low: 0,
  steady: 2,
  full: 3,
};

export type ConflictDisplay = {
  batteryId: BatteryId;
  copy: string;
};

export function conflictDisplays(input: {
  rings: Array<{ batteryId: BatteryId; state: BatteryState | null }>;
  markers: Array<{ batteryId: BatteryId; rating: "low" | "steady" | "full" | null }>;
  batteryNames: Record<string, string>;
}): ConflictDisplay[] {
  const out: ConflictDisplay[] = [];
  for (const ring of input.rings) {
    if (!ring.state) continue;
    const marker = input.markers.find((m) => m.batteryId === ring.batteryId);
    if (!marker?.rating) continue;
    const ringLevel = RING_LEVEL[ring.state];
    const scanLevel = SCAN_LEVEL[marker.rating];
    if (Math.abs(ringLevel - scanLevel) > 1) {
      const name = input.batteryNames[ring.batteryId] ?? ring.batteryId;
      const usual = BATTERY_STATE_LABELS[ring.state];
      const today =
        marker.rating === "low"
          ? "Low"
          : marker.rating === "steady"
            ? "Steady"
            : "Full";
      out.push({
        batteryId: ring.batteryId,
        copy: `Your ${name} battery usually reads ${usual}. Today you marked it ${today}.`,
      });
    }
  }
  return out;
}
